'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers'

interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
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
  selectedCoin: string
  leverage: number
  positionSize: number
  gameActive: boolean
  historicalData: CandleData[]
}

// Binance top coins (real names for authentic experience)
const BINANCE_COINS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', volatility: 0.04 },
  { symbol: 'ETHUSDT', name: 'Ethereum', volatility: 0.05 },
  { symbol: 'BNBUSDT', name: 'BNB', volatility: 0.06 },
  { symbol: 'XRPUSDT', name: 'XRP', volatility: 0.08 },
  { symbol: 'ADAUSDT', name: 'Cardano', volatility: 0.09 },
  { symbol: 'SOLUSDT', name: 'Solana', volatility: 0.12 },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', volatility: 0.15 },
  { symbol: 'DOTUSDT', name: 'Polkadot', volatility: 0.10 },
  { symbol: 'MATICUSDT', name: 'Polygon', volatility: 0.11 },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu', volatility: 0.20 },
  { symbol: 'AVAXUSDT', name: 'Avalanche', volatility: 0.13 },
  { symbol: 'LTCUSDT', name: 'Litecoin', volatility: 0.07 },
  { symbol: 'LINKUSDT', name: 'Chainlink', volatility: 0.09 },
  { symbol: 'UNIUSDT', name: 'Uniswap', volatility: 0.14 },
  { symbol: 'ATOMUSDT', name: 'Cosmos', volatility: 0.12 }
]

interface FuturesGameProps {
  showAuthModal?: boolean
  onShowAuth?: () => void
}

export default function FuturesGameReal({ showAuthModal, onShowAuth }: FuturesGameProps) {
  const { user, logout } = useAuth()
  
  // Get random coin
  const getRandomCoin = () => BINANCE_COINS[Math.floor(Math.random() * BINANCE_COINS.length)]
  
  const [gameState, setGameState] = useState<GameState>({
    balance: 1000, // $1000 USD starting balance
    tokens: 10, // Free 10 tokens
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
    selectedCoin: getRandomCoin().symbol,
    leverage: 10, // Default 10x
    positionSize: 10, // Default 10%
    gameActive: true,
    historicalData: []
  })

  const [isLiquidated, setIsLiquidated] = useState(false)
  const [showTutorial, setShowTutorial] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate realistic historical data
  const generateHistoricalData = (coin: typeof BINANCE_COINS[0], days: number = 50): CandleData[] => {
    const data: CandleData[] = []
    
    // Set realistic price ranges based on coin
    let basePrice = 50000 // Default for BTC
    if (coin.symbol === 'ETHUSDT') basePrice = 3000
    else if (coin.symbol === 'BNBUSDT') basePrice = 300
    else if (coin.symbol === 'XRPUSDT') basePrice = 0.6
    else if (coin.symbol === 'ADAUSDT') basePrice = 0.5
    else if (coin.symbol === 'SOLUSDT') basePrice = 100
    else if (coin.symbol === 'DOGEUSDT') basePrice = 0.08
    else if (coin.symbol === 'SHIBUSDT') basePrice = 0.000025
    else basePrice = Math.random() * 100 + 10
    
    const now = Date.now()
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000)
      const open = basePrice
      
      // Generate realistic OHLC with volatility
      const dailyChange = (Math.random() - 0.5) * coin.volatility
      const high = open * (1 + Math.abs(dailyChange) * Math.random())
      const low = open * (1 - Math.abs(dailyChange) * Math.random())
      const close = open * (1 + dailyChange)
      const volume = Math.random() * 1000000 + 100000
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      })
      
      basePrice = close
    }
    
    return data
  }

  // Auto-start game
  useEffect(() => {
    const selectedCoinData = BINANCE_COINS.find(c => c.symbol === gameState.selectedCoin)!
    const historicalData = generateHistoricalData(selectedCoinData, 50)
    
    setGameState(prev => ({
      ...prev,
      historicalData,
      currentCandleIndex: 20, // Start 20 days in
      gameActive: true
    }))
  }, [gameState.selectedCoin])

  // Calculate P&L for futures
  const calculatePnL = (currentPrice: number) => {
    if (!gameState.position.side) return 0
    
    const { side, entryPrice, size, leverage } = gameState.position
    const priceChangePercent = side === 'long' 
      ? (currentPrice - entryPrice) / entryPrice
      : (entryPrice - currentPrice) / entryPrice
    
    return size * priceChangePercent * leverage
  }

  // Calculate liquidation price
  const calculateLiquidationPrice = (entryPrice: number, side: 'long' | 'short', leverage: number) => {
    const maintenanceMarginRate = 0.005 // 0.5%
    const liquidationBuffer = (1 - maintenanceMarginRate) / leverage
    
    if (side === 'long') {
      return entryPrice * (1 - liquidationBuffer)
    } else {
      return entryPrice * (1 + liquidationBuffer)
    }
  }

  // Open position
  const openPosition = (side: 'long' | 'short') => {
    if (!gameState.historicalData[gameState.currentCandleIndex] || !user) return
    
    const currentPrice = gameState.historicalData[gameState.currentCandleIndex].close
    const notionalValue = (gameState.balance * gameState.positionSize) / 100
    const margin = notionalValue / gameState.leverage
    const liquidationPrice = calculateLiquidationPrice(currentPrice, side, gameState.leverage)
    
    setGameState(prev => ({
      ...prev,
      position: {
        side,
        entryPrice: currentPrice,
        size: notionalValue,
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

  // Next candle
  const nextCandle = () => {
    if (gameState.tokens <= 0 || gameState.currentCandleIndex >= gameState.historicalData.length - 1) return
    
    const nextIndex = gameState.currentCandleIndex + 1
    const nextCandle = gameState.historicalData[nextIndex]
    
    // Check liquidation
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
          balance: prev.balance - prev.position.margin,
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

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || gameState.historicalData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio || 800
    canvas.height = rect.height * window.devicePixelRatio || 400
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const padding = 40
    const chartWidth = (rect.width || 800) - padding * 2
    const chartHeight = (rect.height || 400) - padding * 2
    
    const startIndex = Math.max(0, gameState.currentCandleIndex - 19)
    const endIndex = gameState.currentCandleIndex + 1
    const visibleCandles = gameState.historicalData.slice(startIndex, endIndex)
    
    if (visibleCandles.length === 0) return

    const prices = visibleCandles.flatMap(c => [c.high, c.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice

    const candleWidth = chartWidth / visibleCandles.length
    
    // Draw grid
    ctx.strokeStyle = '#374151'
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
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444'
      ctx.fillStyle = isGreen ? '#10b981' : '#ef4444'
      
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
    })

    // Draw position lines
    if (gameState.position.side) {
      const entryY = padding + chartHeight - ((gameState.position.entryPrice - minPrice) / priceRange) * chartHeight
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(padding, entryY)
      ctx.lineTo(rect.width - padding, entryY)
      ctx.stroke()
      
      const liqY = padding + chartHeight - ((gameState.position.liquidationPrice - minPrice) / priceRange) * chartHeight
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(padding, liqY)
      ctx.lineTo(rect.width - padding, liqY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw price
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px monospace'
    const currentPrice = visibleCandles[visibleCandles.length - 1]?.close || 0
    ctx.fillText(`$${currentPrice.toLocaleString()}`, rect.width - padding - 120, 30)

  }, [gameState.historicalData, gameState.currentCandleIndex, gameState.position])

  const currentCandle = gameState.historicalData[gameState.currentCandleIndex]
  const selectedCoinData = BINANCE_COINS.find(c => c.symbol === gameState.selectedCoin)!

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Auth Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">Welcome to Errdaycoin</h2>
            <p className="text-gray-300 mb-6">
              Sign in with Google to start trading and save your progress
            </p>
            <button
              onClick={onShowAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {showTutorial && user && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 p-8 rounded-lg max-w-2xl mx-4">
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
            <div className="space-y-4 text-gray-300">
              <p>• Start with $1,000 USD</p>
              <p>• Use leverage slider (1x - 100x) to amplify your trades</p>
              <p>• Adjust position size (1% - 100% of balance)</p>
              <p>• Click LONG (green) if you think price will go up</p>
              <p>• Click SHORT (red) if you think price will go down</p>
              <p>• Use tokens to advance to next day</p>
              <p>• Avoid liquidation to keep playing!</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold"
            >
              Start Trading
            </button>
          </div>
        </div>
      )}

      {/* Liquidation Alert */}
      {isLiquidated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-red-600 p-8 rounded-lg text-center animate-pulse">
            <div className="text-6xl mb-4">💥</div>
            <div className="text-3xl font-bold">LIQUIDATED!</div>
            <div className="text-xl mt-2">Position Liquidated</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-green-400">Errdaycoin: Chart Game</h1>
          <div className="text-sm text-gray-400">
            Practice futures trading with historical data
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-400">Balance</div>
            <div className="text-green-400 font-bold">
              ${gameState.balance.toFixed(2)} USD
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{gameState.tokens} tokens</div>
            <div className="text-yellow-400 font-bold">🪙 Next Day</div>
          </div>
          {user && (
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Main Game */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Chart */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">{selectedCoinData?.name || 'Unknown'}</h2>
                {currentCandle && (
                  <div className="text-2xl font-mono text-green-400">
                    ${currentCandle.close.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Day {gameState.currentCandleIndex + 1}/50</div>
                {gameState.position.side && (
                  <div className="text-sm">
                    <span className={`font-bold ${
                      gameState.position.side === 'long' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {gameState.position.side === 'long' ? 'LONG' : 'SHORT'} {gameState.position.leverage}x
                    </span>
                    <div className="text-xs text-gray-400">
                      P&L: {gameState.position.unrealizedPnl > 0 ? '+' : ''}${gameState.position.unrealizedPnl.toFixed(2)}
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
          
          {/* Trading Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Leverage Slider */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Leverage</span>
                <span className="text-sm text-white">{gameState.leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={gameState.leverage}
                onChange={(e) => setGameState(prev => ({ ...prev, leverage: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                disabled={!!gameState.position.side}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1x</span>
                <span>100x</span>
              </div>
            </div>

            {/* Position Size Slider */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Position Size</span>
                <span className="text-sm text-white">{gameState.positionSize}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={gameState.positionSize}
                onChange={(e) => setGameState(prev => ({ ...prev, positionSize: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                disabled={!!gameState.position.side}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Trading Buttons */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => openPosition('long')}
                  disabled={!!gameState.position.side || !user}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-4 rounded font-bold"
                >
                  LONG
                </button>
                <button
                  onClick={() => openPosition('short')}
                  disabled={!!gameState.position.side || !user}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-4 rounded font-bold"
                >
                  SHORT
                </button>
              </div>
              
              {gameState.position.side && (
                <button
                  onClick={closePosition}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded font-bold mb-2"
                >
                  Close Position
                </button>
              )}
              
              <button
                onClick={nextCandle}
                disabled={gameState.tokens <= 0 || !user}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-bold"
              >
                Next Day (1 🪙)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
