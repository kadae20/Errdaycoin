'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers'

interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

interface Position {
  side: 'long' | 'short' | null
  entryPrice: number
  size: number
  leverage: number
  margin: number
  liquidationPrice: number
  unrealizedPnl: number
}

interface GameState {
  balance: number
  tokens: number
  currentCandleIndex: number
  position: Position
  selectedPair: string
  leverage: number
  gameActive: boolean
  historicalData: CandleData[]
}

// Binance coins with hidden names (anti-cheating)
const TRADING_PAIRS = [
  { id: 'COIN_A', volatility: 0.05 },
  { id: 'COIN_B', volatility: 0.06 },
  { id: 'COIN_C', volatility: 0.08 },
  { id: 'COIN_D', volatility: 0.09 },
  { id: 'COIN_E', volatility: 0.10 },
  { id: 'COIN_F', volatility: 0.12 },
  { id: 'COIN_G', volatility: 0.15 },
  { id: 'COIN_H', volatility: 0.18 },
  { id: 'COIN_I', volatility: 0.20 },
  { id: 'COIN_J', volatility: 0.22 },
  { id: 'COIN_K', volatility: 0.25 },
  { id: 'COIN_L', volatility: 0.28 },
  { id: 'COIN_M', volatility: 0.30 },
  { id: 'COIN_N', volatility: 0.32 },
  { id: 'COIN_O', volatility: 0.35 },
  { id: 'COIN_P', volatility: 0.38 },
  { id: 'COIN_Q', volatility: 0.40 },
  { id: 'COIN_R', volatility: 0.42 },
  { id: 'COIN_S', volatility: 0.45 },
  { id: 'COIN_T', volatility: 0.48 }
]

export default function FuturesGameNew() {
  // Auto-start game with random coin
  const getRandomPair = () => TRADING_PAIRS[Math.floor(Math.random() * TRADING_PAIRS.length)]
  
  const [gameState, setGameState] = useState<GameState>({
    balance: 10000, // Start with 10,000 won
    tokens: 10, // Free 10 coins
    currentCandleIndex: 0,
    position: {
      side: null,
      entryPrice: 0,
      size: 0,
      leverage: 1,
      margin: 0,
      liquidationPrice: 0,
      unrealizedPnl: 0
    },
    selectedPair: getRandomPair().id,
    leverage: 10,
    gameActive: true, // Auto-start
    historicalData: []
  })

  const [positionSize, setPositionSize] = useState(50) // Percentage slider (0-100)
  const [isLiquidated, setIsLiquidated] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { logout } = useAuth()

  // Generate historical candlestick data
  const generateHistoricalData = (pair: typeof TRADING_PAIRS[0], days: number = 50): CandleData[] => {
    const data: CandleData[] = []
    // Generate realistic crypto prices
    let basePrice = 25000 + Math.random() * 50000 // $25k-$75k range
    const now = Date.now()
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000) // Daily candles
      const open = basePrice
      
      // Generate realistic OHLC data with volatility
      const dailyChange = (Math.random() - 0.5) * pair.volatility
      const high = open * (1 + Math.abs(dailyChange) * Math.random())
      const low = open * (1 - Math.abs(dailyChange) * Math.random())
      const close = open * (1 + dailyChange)
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close
      })
      
      basePrice = close
    }
    
    return data
  }

  // Auto-start game on component mount
  useEffect(() => {
    const selectedPairData = TRADING_PAIRS.find(p => p.id === gameState.selectedPair)!
    const historicalData = generateHistoricalData(selectedPairData, 50)
    
    setGameState(prev => ({
      ...prev,
      historicalData,
      currentCandleIndex: 20, // Start 20 days in
      gameActive: true
    }))
  }, [])

  // Calculate P&L
  const calculatePnL = (currentPrice: number) => {
    if (!gameState.position.side) return 0
    
    const { side, entryPrice, size, leverage } = gameState.position
    const priceChange = side === 'long' ? currentPrice - entryPrice : entryPrice - currentPrice
    const pnlPercent = (priceChange / entryPrice) * leverage * 100
    return (size * pnlPercent) / 100
  }

  // Open position
  const openPosition = (side: 'long' | 'short') => {
    if (!gameState.historicalData[gameState.currentCandleIndex]) return
    
    const currentPrice = gameState.historicalData[gameState.currentCandleIndex].close
    const positionAmount = (gameState.balance * positionSize) / 100
    const margin = positionAmount / gameState.leverage
    
    // Calculate liquidation price
    const liquidationDistance = 0.8 / gameState.leverage // 80% of margin
    const liquidationPrice = side === 'long' 
      ? currentPrice * (1 - liquidationDistance)
      : currentPrice * (1 + liquidationDistance)
    
    setGameState(prev => ({
      ...prev,
      position: {
        side,
        entryPrice: currentPrice,
        size: positionAmount,
        leverage: prev.leverage,
        margin,
        liquidationPrice,
        unrealizedPnl: 0
      }
    }))
  }

  // Close position
  const closePosition = () => {
    if (!gameState.position.side) return
    
    const pnl = gameState.position.unrealizedPnl
    setGameState(prev => ({
      ...prev,
      balance: prev.balance + pnl,
      position: {
        side: null,
        entryPrice: 0,
        size: 0,
        leverage: 1,
        margin: 0,
        liquidationPrice: 0,
        unrealizedPnl: 0
      }
    }))
  }

  // Next candle (advance time)
  const nextCandle = () => {
    if (gameState.tokens <= 0 || gameState.currentCandleIndex >= gameState.historicalData.length - 1) return
    
    const nextIndex = gameState.currentCandleIndex + 1
    const nextCandle = gameState.historicalData[nextIndex]
    
    // Check for liquidation
    if (gameState.position.side) {
      const isLiquidated = gameState.position.side === 'long' 
        ? nextCandle.low <= gameState.position.liquidationPrice
        : nextCandle.high >= gameState.position.liquidationPrice
        
      if (isLiquidated) {
        setIsLiquidated(true)
        
        setGameState(prev => ({
          ...prev,
          currentCandleIndex: nextIndex,
          tokens: prev.tokens - 1,
          balance: prev.balance - prev.position.margin, // Lose margin
          position: {
            side: null,
            entryPrice: 0,
            size: 0,
            leverage: prev.leverage,
            margin: 0,
            liquidationPrice: 0,
            unrealizedPnl: 0
          }
        }))
        
        // Reset liquidation alert after 3 seconds
        setTimeout(() => setIsLiquidated(false), 3000)
        return
      }
    }
    
    setGameState(prev => ({
      ...prev,
      currentCandleIndex: nextIndex,
      tokens: prev.tokens - 1,
      position: {
        ...prev.position,
        unrealizedPnl: prev.position.side ? calculatePnL(nextCandle.close) : 0
      }
    }))
  }

  // Draw candlestick chart
  useEffect(() => {
    if (!canvasRef.current || gameState.historicalData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio || 800
    canvas.height = rect.height * window.devicePixelRatio || 400
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const padding = 40
    const chartWidth = (rect.width || 800) - padding * 2
    const chartHeight = (rect.height || 400) - padding * 2
    
    // Show last 20 candles
    const startIndex = Math.max(0, gameState.currentCandleIndex - 19)
    const endIndex = gameState.currentCandleIndex + 1
    const visibleCandles = gameState.historicalData.slice(startIndex, endIndex)
    
    if (visibleCandles.length === 0) return

    // Find price range
    const prices = visibleCandles.flatMap(c => [c.high, c.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice

    const candleWidth = chartWidth / visibleCandles.length
    
    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(rect.width - padding, y)
      ctx.stroke()
    }

    // Draw candles
    visibleCandles.forEach((candle, index) => {
      const x = padding + index * candleWidth + candleWidth / 2
      const openY = padding + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight
      const closeY = padding + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight
      const highY = padding + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight
      const lowY = padding + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight
      
      const isGreen = candle.close > candle.open
      ctx.strokeStyle = isGreen ? '#00ff88' : '#ff4757'
      ctx.fillStyle = isGreen ? '#00ff88' : '#ff4757'
      
      // Draw wick
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, highY)
      ctx.lineTo(x, lowY)
      ctx.stroke()
      
      // Draw body
      const bodyHeight = Math.abs(closeY - openY)
      const bodyY = Math.min(openY, closeY)
      ctx.fillRect(x - candleWidth / 4, bodyY, candleWidth / 2, bodyHeight || 1)
      
      // Highlight current candle
      if (index === visibleCandles.length - 1) {
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2
        ctx.strokeRect(x - candleWidth / 4, bodyY, candleWidth / 2, bodyHeight || 1)
      }
    })

    // Draw position entry line
    if (gameState.position.side) {
      const entryY = padding + chartHeight - ((gameState.position.entryPrice - minPrice) / priceRange) * chartHeight
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(padding, entryY)
      ctx.lineTo(rect.width - padding, entryY)
      ctx.stroke()
      ctx.setLineDash([])
      
      // Draw liquidation line
      const liqY = padding + chartHeight - ((gameState.position.liquidationPrice - minPrice) / priceRange) * chartHeight
      ctx.strokeStyle = '#ff4757'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(padding, liqY)
      ctx.lineTo(rect.width - padding, liqY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw price labels
    ctx.fillStyle = '#fff'
    ctx.font = '12px monospace'
    const currentPrice = visibleCandles[visibleCandles.length - 1]?.close || 0
    ctx.fillText(`$${currentPrice.toLocaleString()}`, rect.width - padding - 100, 30)

  }, [gameState.historicalData, gameState.currentCandleIndex, gameState.position, gameState.gameActive])

  const currentCandle = gameState.historicalData[gameState.currentCandleIndex]

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Liquidation Alert */}
      {isLiquidated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-red-600 p-8 rounded-lg text-center animate-pulse">
            <div className="text-6xl mb-4">💥</div>
            <div className="text-3xl font-bold">청산!</div>
            <div className="text-xl mt-2">Position Liquidated</div>
          </div>
        </div>
      )}
      
      {/* Top Header - AlphaSquare Style */}
      <div className="bg-gray-800 p-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-green-400">얼데이코인: 차트게임</h1>
          <div className="text-gray-400">
            과거 실제 데이터 차트 매매 실력 기우기
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-400">게임현황</div>
            <div className="text-green-400 font-bold">
              초기자산 {gameState.balance.toLocaleString()} 원
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">총 {gameState.tokens}개</div>
            <div className="text-yellow-400 font-bold flex items-center gap-1">
              🪙 다음날
            </div>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-sm"
          >
            게임 종료
          </button>
        </div>
      </div>

      {/* Main Game Area - AlphaSquare Style */}
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Chart Container */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">{gameState.selectedPair}/USDT</h2>
                {currentCandle && (
                  <div className="text-2xl font-mono text-green-400">
                    ${currentCandle.close.toLocaleString()}
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  {currentCandle && new Date(currentCandle.timestamp).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">{String(gameState.currentCandleIndex + 1).padStart(2, '0')}/50일</div>
                {gameState.position.side && (
                  <div className="text-sm">
                    <span className={`font-bold ${
                      gameState.position.side === 'long' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {gameState.position.side === 'long' ? '매수 (L)' : '매도 (S)'}
                    </span>
                    <div className="text-xs text-gray-400">
                      수익률: {gameState.position.unrealizedPnl > 0 ? '+' : ''}{((gameState.position.unrealizedPnl / gameState.position.margin) * 100).toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <canvas
              ref={canvasRef}
              className="w-full bg-gray-900 rounded"
              style={{ width: '100%', height: '400px' }}
            />
          </div>
          
          {/* Trading Controls - AlphaSquare Style */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-lg font-bold mb-2">총 50일 내에서 직접한 타이밍에</div>
              <div className="flex justify-center gap-4">
                <div className="text-red-400 font-bold text-xl">매수</div>
                <div className="text-blue-400 font-bold text-xl">매도</div>
              </div>
              <div className="text-sm text-gray-400 mt-2">하고 수익을 올려보세요!</div>
            </div>
            
            {/* Position Size Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">비중</span>
                <span className="text-sm text-white">{positionSize}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={positionSize}
                onChange={(e) => setPositionSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${positionSize}%, #4b5563 ${positionSize}%, #4b5563 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Trading Buttons */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => openPosition('long')}
                disabled={!!gameState.position.side}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white py-4 px-6 rounded-lg font-bold text-lg"
              >
                매수 (L)
              </button>
              <button
                onClick={() => openPosition('short')}
                disabled={!!gameState.position.side}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white py-4 px-6 rounded-lg font-bold text-lg"
              >
                매도 (S)
              </button>
            </div>

            {/* Close Position Button */}
            {gameState.position.side && (
              <button
                onClick={closePosition}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-bold mb-4"
              >
                포지션 종료
              </button>
            )}

            {/* Next Day Button */}
            <button
              onClick={nextCandle}
              disabled={gameState.tokens <= 0}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <span>다음날 (1 🪙)</span>
            </button>

            {/* Game Instructions */}
            <div className="mt-4 text-center text-sm text-gray-400">
              <p>• 레버리지로 더 큰 수익/손실을 경험하세요</p>
              <p>• 토큰을 써서 다음 날 가격을 보세요</p>
              <p>• 청산을 피하면서 수익을 내보세요!</p>
              <p>• 변동성이 높은 코인일수록 어려워요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
