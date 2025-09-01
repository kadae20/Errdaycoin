import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Rate limiting utility using Supabase or in-memory store
 */
export async function rateLimit(
  identifier: string, // IP or user ID
  key: string, // API endpoint key
  config: RateLimitConfig,
  supabase?: ReturnType<typeof createClient<Database>>
): Promise<RateLimitResult> {
  const now = Date.now()
  const resetTime = now + config.windowMs
  
  if (supabase) {
    return await supabaseRateLimit(identifier, key, config, supabase, now, resetTime)
  } else {
    return memoryRateLimit(identifier, key, config, now, resetTime)
  }
}

async function supabaseRateLimit(
  identifier: string,
  key: string,
  config: RateLimitConfig,
  supabase: ReturnType<typeof createClient<Database>>,
  now: number,
  resetTime: number
): Promise<RateLimitResult> {
  const limitKey = `${identifier}:${key}`
  const windowStart = now - config.windowMs

  try {
    // Clean up old entries
    await supabase
      .from('ratelimit_hits')
      .delete()
      .lt('ts', new Date(windowStart).toISOString())

    // Count current requests in window
    const { count } = await supabase
      .from('ratelimit_hits')
      .select('*', { count: 'exact', head: true })
      .eq('ip', identifier)
      .eq('key', key)
      .gte('ts', new Date(windowStart).toISOString())

    const currentCount = count || 0

    if (currentCount >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
      }
    }

    // Record this request
    await supabase
      .from('ratelimit_hits')
      .upsert(
        {
          ip: identifier,
          key,
          ts: new Date(now).toISOString(),
        },
        {
          onConflict: 'ip,key',
        }
      )

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - currentCount - 1,
      resetTime,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fallback to memory store on database error
    return memoryRateLimit(identifier, key, config, now, resetTime)
  }
}

function memoryRateLimit(
  identifier: string,
  key: string,
  config: RateLimitConfig,
  now: number,
  resetTime: number
): RateLimitResult {
  const limitKey = `${identifier}:${key}`
  const current = memoryStore.get(limitKey)

  // Clean expired entries periodically
  if (Math.random() < 0.01) { // 1% chance
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetTime < now) {
        memoryStore.delete(key)
      }
    }
  }

  if (!current || current.resetTime < now) {
    // New window
    memoryStore.set(limitKey, { count: 1, resetTime })
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  if (current.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  // Increment count
  current.count++
  memoryStore.set(limitKey, current)

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}
