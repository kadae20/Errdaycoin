'use client'

import { useState, useEffect, useRef } from 'react'

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
  tokens: number // Game coins for advancing candles
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

export default function FuturesGame() {
  const [gameState, setGameState] = useState<GameState>({
    balance: 1000,
    tokens: 10,
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
    selectedPair: 'COIN_A',
    leverage: 10,
    gameActive: false,
    historicalData: []
  })

  const [tradeAmount, setTradeAmount] = useState(100)
  const [showPairSelector, setShowPairSelector] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate historical candlestick data
  const generateHistoricalData = (pair: typeof TRADING_PAIRS[0], days: number = 50): CandleData[] => {
    const data: CandleData[] = []
    let basePrice = Math.random() * 50000 + 10000 // Random base price
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
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 1000000)
      })
      
      basePrice = close
    }
    
    return data
  }

  // Start new game
  const startNewGame = () => {
    const selectedPairData = TRADING_PAIRS.find(p => p.id === gameState.selectedPair)!
    const historicalData = generateHistoricalData(selectedPairData, 50)
    
    setGameState(prev => ({
      ...prev,
      historicalData,
      currentCandleIndex: 20, // Start 20 days in
      gameActive: true,
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
  }

  // Calculate liquidation price
  const calculateLiquidationPrice = (entryPrice: number, side: 'long' | 'short', leverage: number): number => {
    const maintenanceMarginRate = 0.005 // 0.5%
    if (side === 'long') {
      return entryPrice * (1 - (1 / leverage) + maintenanceMarginRate)
    } else {
      return entryPrice * (1 + (1 / leverage) - maintenanceMarginRate)
    }
  }

  // Open position
  const openPosition = (side: 'long' | 'short') => {
    if (!gameState.gameActive || gameState.position.side) return
    
    const currentCandle = gameState.historicalData[gameState.currentCandleIndex]
    const entryPrice = currentCandle.close
    const margin = tradeAmount
    const size = margin * gameState.leverage / entryPrice
    const liquidationPrice = calculateLiquidationPrice(entryPrice, side, gameState.leverage)
    
    if (margin > gameState.balance) {
      alert('Insufficient balance!')
      return
    }
    
    setGameState(prev => ({
      ...prev,
      balance: prev.balance - margin,
      position: {
        side,
        entryPrice,
        size,
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
    
    const currentCandle = gameState.historicalData[gameState.currentCandleIndex]
    const exitPrice = currentCandle.close
    const pnl = calculatePnL(exitPrice)
    
    setGameState(prev => ({
      ...prev,
      balance: prev.balance + prev.position.margin + pnl,
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
  }

  // Calculate PnL
  const calculatePnL = (currentPrice: number): number => {
    if (!gameState.position.side) return 0
    
    const { entryPrice, size, side } = gameState.position
    const priceDiff = side === 'long' ? currentPrice - entryPrice : entryPrice - currentPrice
    return priceDiff * size
  }

  // Advance to next candle (costs 1 token)
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
        alert('Position Liquidated! 💥')
        setGameState(prev => ({
          ...prev,
          currentCandleIndex: nextIndex,
          tokens: prev.tokens - 1,
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
  const selectedPairData = TRADING_PAIRS.find(p => p.id === gameState.selectedPair)!

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-green-400">Errdaycoin Futures</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPairSelector(true)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
              >
                {gameState.selectedPair}/USDT
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-lg font-mono text-green-400">
                ${gameState.balance.toLocaleString()}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-400">Tokens</div>
              <div className="text-lg font-mono text-yellow-400">
                🪙 {gameState.tokens}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Chart Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">{gameState.selectedPair}/USDT</h2>
                  {currentCandle && (
                    <div className="text-2xl font-mono text-green-400">
                      ${currentCandle.close.toLocaleString()}
                    </div>
                  )}
                  {gameState.position.side && (
                    <div className={`text-lg font-mono ${gameState.position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      PnL: ${gameState.position.unrealizedPnl.toFixed(2)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {gameState.position.side && (
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      gameState.position.side === 'long' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {gameState.position.side.toUpperCase()} {gameState.position.leverage}x
                    </span>
                  )}
                </div>
              </div>
              
              <canvas
                ref={canvasRef}
                className="w-full bg-gray-900 rounded"
                style={{ width: '100%', height: '400px' }}
              />
              
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={nextCandle}
                  disabled={gameState.tokens <= 0 || !gameState.gameActive}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold"
                >
                  Next Day (1 🪙)
                </button>
                
                {currentCandle && (
                  <div className="text-sm text-gray-400">
                    Day {gameState.currentCandleIndex + 1} • 
                    O: ${currentCandle.open} H: ${currentCandle.high} L: ${currentCandle.low} C: ${currentCandle.close}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-4">
            
            {!gameState.gameActive && (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">Futures Trading</h3>
                <p className="text-gray-400 mb-6">
                  Trade with leverage using historical data. Use tokens to advance time!
                </p>
                <button
                  onClick={startNewGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Start New Game
                </button>
              </div>
            )}

            {gameState.gameActive && (
              <>
                {/* Leverage Control */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Leverage</h4>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[1, 2, 5, 10, 20, 25, 50, 75, 100].map(lev => (
                      <button
                        key={lev}
                        onClick={() => setGameState(prev => ({ ...prev, leverage: lev }))}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          gameState.leverage === lev ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {lev}x
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">
                    Higher leverage = Higher risk & reward
                  </div>
                </div>

                {/* Trade Amount */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Trade Amount</h4>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(Number(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    min="10"
                    max={gameState.balance}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Position Size: ${((tradeAmount * gameState.leverage) / (currentCandle?.close || 1)).toFixed(4)}
                  </div>
                </div>

                {/* Position Controls */}
                {!gameState.position.side ? (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Open Position</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => openPosition('long')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                      >
                        📈 LONG (Buy)
                      </button>
                      <button
                        onClick={() => openPosition('short')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                      >
                        📉 SHORT (Sell)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Position Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Side:</span>
                        <span className={`font-semibold ${gameState.position.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                          {gameState.position.side?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entry:</span>
                        <span className="font-mono">${gameState.position.entryPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Liquidation:</span>
                        <span className="font-mono text-red-400">${gameState.position.liquidationPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Margin:</span>
                        <span className="font-mono">${gameState.position.margin}</span>
                      </div>
                    </div>
                    <button
                      onClick={closePosition}
                      className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                      Close Position
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Game Rules */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">How to Play</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Use leverage for bigger profits/losses</li>
                <li>• Spend tokens to see next day's price</li>
                <li>• Avoid liquidation at all costs!</li>
                <li>• Higher volatility coins = harder</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Pair Selector Modal */}
      {showPairSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Select Trading Pair</h3>
            <div className="space-y-2">
              {TRADING_PAIRS.map(pair => (
                <button
                  key={pair.id}
                  onClick={() => {
                    setGameState(prev => ({ ...prev, selectedPair: pair.id }))
                    setShowPairSelector(false)
                  }}
                  className={`w-full p-3 rounded text-left hover:bg-gray-700 ${
                    gameState.selectedPair === pair.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{pair.id}/USDT</div>
                      <div className="text-sm text-gray-400">Volatility: {(pair.volatility * 100).toFixed(1)}%</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      #{TRADING_PAIRS.indexOf(pair) + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPairSelector(false)}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
