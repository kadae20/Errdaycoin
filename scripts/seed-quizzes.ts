#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Database } from '../lib/types/database'
import { QuizDataSchema, Candle } from '../lib/types'
import { calculateQuizAnswer, calculateDifficulty } from '../lib/utils/scoring'

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface QuizConfig {
  previewCandleCount: number
  answerCandleCount: number
  priceChangeThreshold: number
}

const DEFAULT_CONFIG: QuizConfig = {
  previewCandleCount: 40,
  answerCandleCount: 10,
  priceChangeThreshold: 0.002, // 0.2%
}

/**
 * Load sample data files
 */
function loadSampleData(): any[] {
  const dataDir = join(process.cwd(), 'data', 'sample')
  const files = ['btc-1m-sample.json', 'eth-5m-sample.json']
  
  const datasets = []
  
  for (const file of files) {
    try {
      const filePath = join(dataDir, file)
      const content = readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)
      const validated = QuizDataSchema.parse(data)
      datasets.push(validated)
      console.log(`✓ Loaded ${file}: ${validated.candles.length} candles`)
    } catch (error) {
      console.error(`✗ Failed to load ${file}:`, error)
    }
  }
  
  return datasets
}

/**
 * Generate quiz segments from candle data
 */
function generateQuizSegments(
  dataset: { symbol: string; timeframe: string; candles: Candle[] },
  config: QuizConfig = DEFAULT_CONFIG
): Array<{
  symbol: string
  timeframe: string
  previewCandles: Candle[]
  answerCandles: Candle[]
  answer: 'UP' | 'DOWN' | 'FLAT'
  difficulty: number
  startTs: Date
}> {
  const { symbol, timeframe, candles } = dataset
  const { previewCandleCount, answerCandleCount, priceChangeThreshold } = config
  
  const segments = []
  const totalRequired = previewCandleCount + answerCandleCount
  
  // Generate multiple segments from the dataset
  for (let i = 0; i <= candles.length - totalRequired; i += Math.floor(totalRequired / 2)) {
    if (i + totalRequired > candles.length) break
    
    const previewCandles = candles.slice(i, i + previewCandleCount)
    const answerCandles = candles.slice(i + previewCandleCount, i + totalRequired)
    
    // Calculate the correct answer
    const answer = calculateQuizAnswer(previewCandles, answerCandles, priceChangeThreshold)
    
    // Calculate difficulty based on all candles
    const allCandles = [...previewCandles, ...answerCandles]
    const difficulty = calculateDifficulty(allCandles)
    
    // Start timestamp
    const startTs = new Date(previewCandles[0].t)
    
    segments.push({
      symbol,
      timeframe,
      previewCandles,
      answerCandles,
      answer,
      difficulty,
      startTs,
    })
  }
  
  return segments
}

/**
 * Insert quiz segments into database
 */
async function insertQuizSegments(segments: any[]): Promise<void> {
  console.log(`\nInserting ${segments.length} quiz segments...`)
  
  const batchSize = 10
  let inserted = 0
  let errors = 0
  
  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize)
    
    try {
      const { data, error } = await (supabase as any)
        .from('quiz_bank')
        .insert(
          batch.map(segment => ({
            symbol: segment.symbol,
            timeframe: segment.timeframe,
            start_ts: segment.startTs.toISOString(),
            preview_candles: segment.previewCandles,
            answer_candles: segment.answerCandles,
            answer: segment.answer,
            difficulty: segment.difficulty,
          }))
        )
        .select('id')
      
      if (error) {
        console.error(`✗ Batch ${i / batchSize + 1} failed:`, error.message)
        errors += batch.length
      } else {
        console.log(`✓ Batch ${i / batchSize + 1}: ${batch.length} segments`)
        inserted += batch.length
      }
    } catch (error) {
      console.error(`✗ Batch ${i / batchSize + 1} error:`, error)
      errors += batch.length
    }
  }
  
  console.log(`\nResults: ${inserted} inserted, ${errors} errors`)
}

/**
 * Clean existing quiz data (optional)
 */
async function cleanExistingData(): Promise<void> {
  console.log('Cleaning existing quiz data...')
  
        const { error } = await (supabase as any)
    .from('quiz_bank')
    .delete()
    .neq('id', 0) // Delete all rows
  
  if (error) {
    console.error('✗ Failed to clean existing data:', error.message)
    throw error
  }
  
  console.log('✓ Existing data cleaned')
}

/**
 * Display statistics
 */
async function displayStatistics(): Promise<void> {
  console.log('\n=== Database Statistics ===')
  
  // Count total quizzes
  const { count: totalCount, error: countError } = await supabase
    .from('quiz_bank')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('Error getting total count:', countError.message)
    return
  }
  
  console.log(`Total quizzes: ${totalCount}`)
  
  // Count by difficulty
  for (let difficulty = 1; difficulty <= 3; difficulty++) {
    const { count, error } = await supabase
      .from('quiz_bank')
      .select('*', { count: 'exact', head: true })
      .eq('difficulty', difficulty)
    
    if (!error) {
      console.log(`Difficulty ${difficulty}: ${count} quizzes`)
    }
  }
  
  // Count by symbol
  const { data: symbols, error: symbolError } = await (supabase as any)
    .from('quiz_bank')
    .select('symbol')
    .group('symbol')
  
  if (!symbolError && symbols) {
    const symbolCounts = new Map<string, number>()
    
    for (const symbol of ['BTCUSDT', 'ETHUSDT']) {
      const { count } = await supabase
        .from('quiz_bank')
        .select('*', { count: 'exact', head: true })
        .eq('symbol', symbol)
      
      if (count !== null) {
        symbolCounts.set(symbol, count)
      }
    }
    
    symbolCounts.forEach((count, symbol) => {
      console.log(`${symbol}: ${count} quizzes`)
    })
  }
  
  // Count by answer
  for (const answer of ['UP', 'DOWN', 'FLAT']) {
    const { count, error } = await supabase
      .from('quiz_bank')
      .select('*', { count: 'exact', head: true })
      .eq('answer', answer)
    
    if (!error) {
      console.log(`${answer}: ${count} quizzes`)
    }
  }
}

/**
 * Main seeding function
 */
async function main(): Promise<void> {
  console.log('🌱 Starting quiz database seeding...\n')
  
  try {
    // Load sample data
    console.log('=== Loading Sample Data ===')
    const datasets = loadSampleData()
    
    if (datasets.length === 0) {
      console.error('No datasets loaded. Exiting.')
      process.exit(1)
    }
    
    // Generate quiz segments
    console.log('\n=== Generating Quiz Segments ===')
    let allSegments: any[] = []
    
    for (const dataset of datasets) {
      const segments = generateQuizSegments(dataset)
      console.log(`${dataset.symbol} (${dataset.timeframe}): ${segments.length} segments`)
      allSegments = allSegments.concat(segments)
    }
    
    console.log(`Total segments generated: ${allSegments.length}`)
    
    // Show distribution
    const answerDistribution = allSegments.reduce((acc, segment) => {
      acc[segment.answer] = (acc[segment.answer] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('Answer distribution:', answerDistribution)
    
    // Clean existing data (optional - comment out if you want to keep existing data)
    console.log('\n=== Database Operations ===')
    await cleanExistingData()
    
    // Insert new data
    await insertQuizSegments(allSegments)
    
    // Display final statistics
    await displayStatistics()
    
    console.log('\n🎉 Seeding completed successfully!')
    
  } catch (error) {
    console.error('\n💥 Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeding script
if (require.main === module) {
  main()
}
