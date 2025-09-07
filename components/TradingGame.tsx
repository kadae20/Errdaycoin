'use client'

import { useState, useEffect, useRef } from 'react'

interface PriceData {
  timestamp: number
  price: number
  volume: number
}

interface GameState {
  balance: number
  position: number // positive = long, negative = short, 0 = no position
  positionPrice: number
  pnl: number
  gameActive: boolean
  timeLeft: number
  score: number
}

export default function TradingGame() {
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [currentPrice, setCurrentPrice] = useState(50000)
  const [gameState, setGameState] = useState<GameState>({
    balance: 10000,
    position: 0,
    positionPrice: 0,
    pnl: 0,
    gameActive: false,
    timeLeft: 60,
    score: 0
  })
  const [prediction, setPrediction] = useState<'up' | 'down' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Generate realistic price data
  const generatePriceData = () => {
    const newData: PriceData[] = []
    let price = 50000 + Math.random() * 10000 // Start between 50k-60k
    const now = Date.now()
    
    for (let i = 100; i >= 0; i--) {
      const timestamp = now - (i * 1000) // 1 second intervals
      const volatility = 0.002 // 0.2% volatility
      const change = (Math.random() - 0.5) * volatility
      price = price * (1 + change)
      
      newData.push({
        timestamp,
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 1000000)
      })
    }
    
    return newData
  }

  // Start new game
  const startGame = () => {
    const initialData = generatePriceData()
    setPriceData(initialData)
    setCurrentPrice(initialData[initialData.length - 1].price)
    setGameState({
      balance: 10000,
      position: 0,
      positionPrice: 0,
      pnl: 0,
      gameActive: true,
      timeLeft: 30, // 30 second game
      score: 0
    })
    setPrediction(null)
    setShowResult(false)
  }

  // Make prediction
  const makePrediction = (direction: 'up' | 'down') => {
    if (!gameState.gameActive || prediction) return
    
    setPrediction(direction)
    setGameState(prev => ({
      ...prev,
      positionPrice: currentPrice,
      position: direction === 'up' ? 1 : -1
    }))
  }

  // Update price simulation
  useEffect(() => {
    if (!gameState.gameActive) return

    intervalRef.current = setInterval(() => {
      setCurrentPrice(prev => {
        const volatility = 0.003 // 0.3% volatility per second
        const trend = Math.random() > 0.5 ? 0.0005 : -0.0005 // Small trend
        const change = (Math.random() - 0.5) * volatility + trend
        const newPrice = prev * (1 + change)
        
        // Add to price data
        setPriceData(prevData => {
          const newData = [...prevData.slice(-99), {
            timestamp: Date.now(),
            price: Math.round(newPrice * 100) / 100,
            volume: Math.floor(Math.random() * 1000000)
          }]
          return newData
        })
        
        return Math.round(newPrice * 100) / 100
      })

      // Update timer
      setGameState(prev => {
        const newTimeLeft = prev.timeLeft - 1
        
        if (newTimeLeft <= 0) {
          // Game over
          const finalPnl = prev.position * (currentPrice - prev.positionPrice)
          const finalScore = Math.round(prev.balance + finalPnl)
          
          setShowResult(true)
          return {
            ...prev,
            gameActive: false,
            timeLeft: 0,
            pnl: finalPnl,
            score: finalScore
          }
        }
        
        return {
          ...prev,
          timeLeft: newTimeLeft,
          pnl: prev.position * (currentPrice - prev.positionPrice)
        }
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [gameState.gameActive, currentPrice])

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || priceData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up chart area
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Find min/max prices
    const prices = priceData.map(d => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice

    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()
    }

    // Draw price line
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2
    ctx.beginPath()

    priceData.forEach((data, index) => {
      const x = padding + (chartWidth / (priceData.length - 1)) * index
      const y = padding + chartHeight - ((data.price - minPrice) / priceRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw current price line
    const currentY = padding + chartHeight - ((currentPrice - minPrice) / priceRange) * chartHeight
    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(padding, currentY)
    ctx.lineTo(canvas.width - padding, currentY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw price labels
    ctx.fillStyle = '#fff'
    ctx.font = '12px monospace'
    ctx.fillText(`$${currentPrice.toLocaleString()}`, canvas.width - padding - 100, currentY - 5)

  }, [priceData, currentPrice])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-green-400">Errdaycoin</h1>
            <div className="text-sm text-gray-400">
              BTC/USD Trading Game
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-lg font-mono text-green-400">
                ${(gameState.balance + gameState.pnl).toLocaleString()}
              </div>
            </div>
            
            {gameState.gameActive && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Time Left</div>
                <div className="text-lg font-mono text-red-400">
                  {gameState.timeLeft}s
                </div>
              </div>
            )}
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
                  <h2 className="text-xl font-semibold">BTC/USD</h2>
                  <div className="text-2xl font-mono text-green-400">
                    ${currentPrice.toLocaleString()}
                  </div>
                  {gameState.position !== 0 && (
                    <div className={`text-lg font-mono ${gameState.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      PnL: ${gameState.pnl.toFixed(2)}
                    </div>
                  )}
                </div>
                
                {prediction && (
                  <div className={`px-3 py-1 rounded text-sm font-semibold ${
                    prediction === 'up' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    Prediction: {prediction === 'up' ? '📈 UP' : '📉 DOWN'}
                  </div>
                )}
              </div>
              
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full bg-gray-900 rounded"
              />
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-4">
            
            {!gameState.gameActive && !showResult && (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">Ready to Trade?</h3>
                <p className="text-gray-400 mb-6">
                  Predict if Bitcoin will go UP or DOWN in the next 30 seconds!
                </p>
                <button
                  onClick={startGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Start New Game
                </button>
              </div>
            )}

            {gameState.gameActive && !prediction && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Make Your Prediction</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => makePrediction('up')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    📈 UP
                  </button>
                  <button
                    onClick={() => makePrediction('down')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    📉 DOWN
                  </button>
                </div>
              </div>
            )}

            {gameState.gameActive && prediction && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Position Active</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entry Price:</span>
                    <span className="font-mono">${gameState.positionPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="font-mono">${currentPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">P&L:</span>
                    <span className={`font-mono ${gameState.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${gameState.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {showResult && (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">Game Over!</h3>
                <div className="space-y-2 mb-6">
                  <div className={`text-2xl font-bold ${gameState.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {gameState.pnl >= 0 ? '🎉 WIN!' : '😞 LOSS'}
                  </div>
                  <div className="text-lg">
                    P&L: <span className={`font-mono ${gameState.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${gameState.pnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Final Score: {gameState.score.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={startGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Play Again
                </button>
              </div>
            )}

            {/* Game Rules */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">How to Play</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Predict if Bitcoin goes UP or DOWN</li>
                <li>• You have 30 seconds per round</li>
                <li>• Win/lose based on price movement</li>
                <li>• Build your score over time!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
