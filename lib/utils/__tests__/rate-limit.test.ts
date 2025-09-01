import { rateLimit, getClientIP } from '../rate-limit'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    delete: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
  })),
}

describe('Rate limiting utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rateLimit with memory store', () => {
    it('should allow first request', async () => {
      const result = await rateLimit(
        'test-ip',
        'test-endpoint',
        { windowMs: 60000, maxRequests: 5 }
      )

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.limit).toBe(5)
    })

    it('should track multiple requests', async () => {
      const identifier = 'test-ip-2'
      const key = 'test-endpoint'
      const config = { windowMs: 60000, maxRequests: 3 }

      // First request
      const result1 = await rateLimit(identifier, key, config)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(2)

      // Second request
      const result2 = await rateLimit(identifier, key, config)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)

      // Third request
      const result3 = await rateLimit(identifier, key, config)
      expect(result3.success).toBe(true)
      expect(result3.remaining).toBe(0)
    })

    it('should reject requests when limit exceeded', async () => {
      const identifier = 'test-ip-3'
      const key = 'test-endpoint'
      const config = { windowMs: 60000, maxRequests: 2 }

      // Use up the limit
      await rateLimit(identifier, key, config)
      await rateLimit(identifier, key, config)

      // This should be rejected
      const result = await rateLimit(identifier, key, config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should handle different identifiers separately', async () => {
      const config = { windowMs: 60000, maxRequests: 2 }

      const result1 = await rateLimit('ip-1', 'endpoint', config)
      const result2 = await rateLimit('ip-2', 'endpoint', config)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.remaining).toBe(1)
      expect(result2.remaining).toBe(1)
    })

    it('should handle different keys separately', async () => {
      const identifier = 'same-ip'
      const config = { windowMs: 60000, maxRequests: 2 }

      const result1 = await rateLimit(identifier, 'endpoint-1', config)
      const result2 = await rateLimit(identifier, 'endpoint-2', config)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.remaining).toBe(1)
      expect(result2.remaining).toBe(1)
    })

    it('should reset after window expires', async () => {
      const identifier = 'test-ip-reset'
      const key = 'test-endpoint'
      const config = { windowMs: 100, maxRequests: 1 } // Very short window

      // First request should succeed
      const result1 = await rateLimit(identifier, key, config)
      expect(result1.success).toBe(true)

      // Second request should fail
      const result2 = await rateLimit(identifier, key, config)
      expect(result2.success).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Third request should succeed again
      const result3 = await rateLimit(identifier, key, config)
      expect(result3.success).toBe(true)
    })
  })

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.2')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('should return "unknown" when no IP headers present', () => {
      const request = new Request('http://localhost')

      const ip = getClientIP(request)
      expect(ip).toBe('unknown')
    })

    it('should handle multiple IPs in x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '  192.168.1.1  ,  10.0.0.1  ,  172.16.0.1  ',
        },
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })
  })

  describe('rateLimit with Supabase', () => {
    it('should fall back to memory store on Supabase error', async () => {
      const mockSupabaseWithError = {
        from: jest.fn(() => ({
          delete: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          upsert: jest.fn().mockReturnThis(),
        })),
      }

      // Mock the select to throw an error
      mockSupabaseWithError.from().select.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const result = await rateLimit(
        'test-ip',
        'test-endpoint',
        { windowMs: 60000, maxRequests: 5 },
        mockSupabaseWithError as any
      )

      // Should still work with memory fallback
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })
  })
})
