'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers'
import { gameService } from '@/lib/services/game-service'
import { referralService } from '@/lib/services/referral-service'
import { binanceAPI } from '@/lib/services/binance-api'
import { 
  GameSession, 
  Position, 
  CandleData, 
  UserTokens,
  calculateLiquidationPrice,
  calculatePNL,
  calculateROI,
  GAME_CONSTANTS
} from '@/lib/types/game'
import BitgetBanner from './BitgetBanner'

interface GameState {
  session?: GameSession
  chartData: CandleData[]
  previewData: CandleData[]
  currentCandleIndex: number
  position?: Position
  userTokens?: UserTokens
  referralCode?: string
  nextdayUsesLeft: number
  isPositionOpen: boolean
  isLiquidated: boolean
  gameEnded: boolean
}

interface GameProps {
  onShowAuth?: () => void
  onGameComplete?: () => void
  isGuestMode?: boolean
}

export default function ErrdayCoinGame({ onShowAuth, onGameComplete, isGuestMode = false }: GameProps) {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [gameState, setGameState] = useState<GameState>({
    chartData: [],
    previewData: [],
    currentCandleIndex: 0,
    nextdayUsesLeft: GAME_CONSTANTS.DEFAULT_NEXTDAY_USES,
    isPositionOpen: false,
    isLiquidated: false,
    gameEnded: false
  })

  const [gameSettings, setGameSettings] = useState({
    side: 'long' as 'long' | 'short',
    leverage: 10,
    positionPercentage: 10, // 포트폴리오 대비 %
  })

  const [showTutorial, setShowTutorial] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // 게임 초기화
  useEffect(() => {
    if (user || isGuestMode) {
      initializeGame()
      if (user) {
        loadUserData()
      }
    }
  }, [user, isGuestMode])

  const initializeGame = async () => {
    try {
      setIsLoading(true)
      
      // 게스트 모드에서는 더미 데이터로 게임 시작
      if (isGuestMode) {
        const gameData = await binanceAPI.getRandomGameChart()
        setGameState(prev => ({
          ...prev,
          chartData: gameData.full_data,
          previewData: gameData.preview_candles,
          currentCandleIndex: gameData.preview_candles.length,
          nextdayUsesLeft: GAME_CONSTANTS.DEFAULT_NEXTDAY_USES,
          isPositionOpen: false,
          isLiquidated: false,
          gameEnded: false
        }))
        drawChart()
        return
      }

      const result = await gameService.startNewGame(user!.id)
      
      setGameState(prev => ({
        ...prev,
        session: result.session,
        chartData: result.chartData,
        previewData: result.previewData,
        currentCandleIndex: result.previewData.length - 1,
        gameEnded: false,
        isLiquidated: false,
        isPositionOpen: false
      }))

      // 차트 렌더링
      drawChart()
    } catch (error) {
      console.error('Failed to initialize game:', error)
      alert('Game initialization failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      const [tokens, referralCode] = await Promise.all([
        gameService.getUserTokens(user!.id),
        referralService.getUserReferralCode(user!.id)
      ])

      setGameState(prev => ({
        ...prev,
        userTokens: tokens,
        referralCode: referralCode
      }))
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  // 포지션 진입
  const enterPosition = async () => {
    if (!isGuestMode && (!gameState.session || !user)) return

    try {
      setIsLoading(true)
      const currentPrice = gameState.previewData[gameState.currentCandleIndex - 1]?.close || 
                          gameState.chartData[gameState.currentCandleIndex - 1]?.close
      
      if (!currentPrice) {
        alert('Cannot get current price')
        return
      }

      // 게스트 모드에서는 클라이언트에서만 처리
      if (isGuestMode) {
        const liquidationPrice = gameSettings.side === 'long' 
          ? currentPrice * (1 - 1/gameSettings.leverage)
          : currentPrice * (1 + 1/gameSettings.leverage)

        const newPosition: Position = {
          id: 'guest-position',
          user_id: 'guest',
          session_id: 'guest-session',
          side: gameSettings.side,
          leverage: gameSettings.leverage,
          position_size: gameSettings.positionSize || 100,
          entry_price: currentPrice,
          liquidation_price: liquidationPrice,
          unrealized_pnl: 0,
          roi: 0,
          is_liquidated: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        setGameState(prev => ({
          ...prev,
          position: newPosition,
          isPositionOpen: true
        }))

        drawChart()
        return
      }

      const updatedSession = await gameService.enterPosition(
        gameState.session!.id,
        gameSettings.side,
        gameSettings.leverage,
        gameSettings.positionPercentage,
        currentPrice
      )

      const position: Position = {
        side: gameSettings.side,
        entry_price: currentPrice,
        leverage: gameSettings.leverage,
        position_size: updatedSession.position_size!,
        liquidation_price: updatedSession.liquidation_price!,
        current_price: currentPrice,
        unrealized_pnl: 0,
        roi: 0
      }

      setGameState(prev => ({
        ...prev,
        session: updatedSession,
        position,
        isPositionOpen: true
      }))

      drawChart()
    } catch (error) {
      console.error('Failed to enter position:', error)
      alert('Position entry failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 다음 날 공개
  const revealNextDay = async () => {
    if (!isGuestMode && (!gameState.session || !gameState.position || !user)) return
    if (!gameState.position) return

    try {
      setIsLoading(true)
      const nextCandleIndex = gameState.currentCandleIndex + 1
      
      if (nextCandleIndex >= gameState.chartData.length) {
        setGameState(prev => ({ ...prev, gameEnded: true }))
        return
      }

      const nextPrice = gameState.chartData[nextCandleIndex]?.close
      
      if (!nextPrice) {
        alert('Cannot get next price data')
        return
      }
      
      // 게스트 모드에서는 클라이언트에서만 처리
      if (isGuestMode) {
        const priceDiff = gameState.position.side === 'long' 
          ? (nextPrice - gameState.position.entry_price) / gameState.position.entry_price
          : (gameState.position.entry_price - nextPrice) / gameState.position.entry_price
        
        const newPnl = priceDiff * gameState.position.leverage * gameState.position.position_size
        const newRoi = priceDiff * gameState.position.leverage * 100

        // 청산 체크
        const isLiquidated = gameState.position.side === 'long' 
          ? nextPrice <= gameState.position.liquidation_price
          : nextPrice >= gameState.position.liquidation_price

        setGameState(prev => ({
          ...prev,
          currentCandleIndex: nextCandleIndex,
          previewData: [...prev.previewData, gameState.chartData[nextCandleIndex]],
          nextdayUsesLeft: Math.max(0, prev.nextdayUsesLeft - 1),
          position: prev.position ? {
            ...prev.position,
            unrealized_pnl: newPnl,
            roi: newRoi,
            is_liquidated: isLiquidated
          } : undefined,
          isLiquidated,
          gameEnded: isLiquidated || prev.nextdayUsesLeft <= 1
        }))

        drawChart()

        if (isLiquidated) {
          alert(`Liquidated! PNL: ${newPnl?.toFixed(2)} USDT (${newRoi?.toFixed(2)}%)`)
        }
        return
      }

      const result = await gameService.revealNextDay(
        gameState.session!.id,
        nextCandleIndex,
        nextPrice
      )

      // PNL 계산
      const unrealizedPnl = calculatePNL(
        gameState.position.entry_price,
        nextPrice,
        gameState.position.position_size,
        gameState.position.leverage,
        gameState.position.side
      )

      const roi = calculateROI(unrealizedPnl, gameState.position.position_size)

      setGameState(prev => ({
        ...prev,
        session: result.session,
        currentCandleIndex: nextCandleIndex,
        position: {
          ...prev.position!,
          current_price: nextPrice,
          unrealized_pnl: unrealizedPnl,
          roi: roi
        },
        isLiquidated: result.isLiquidated,
        gameEnded: result.isLiquidated,
        nextdayUsesLeft: GAME_CONSTANTS.DEFAULT_NEXTDAY_USES - result.session.nextday_uses_consumed
      }))

      // 토큰 정보 업데이트
      await loadUserData()
      
      drawChart()

      if (result.isLiquidated) {
        alert(`Liquidated! PNL: ${result.pnl?.toFixed(2)} USDT (${result.roi?.toFixed(2)}%)`)
      }
    } catch (error) {
      console.error('Failed to reveal next day:', error)
      alert('Next Day failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 포지션 종료
  const closePosition = async () => {
    if (!gameState.session || !gameState.position || !user) return

    try {
      setIsLoading(true)
      const currentPrice = gameState.position.current_price || gameState.position.entry_price
      
      await gameService.closePosition(gameState.session.id, currentPrice)
      
      setGameState(prev => ({
        ...prev,
        isPositionOpen: false,
        gameEnded: true
      }))

      alert(`Position closed! PNL: ${gameState.position.unrealized_pnl?.toFixed(2)} USDT (${gameState.position.roi?.toFixed(2)}%)`)
    } catch (error) {
      console.error('Failed to close position:', error)
      alert('Position close failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 게임 재시작
  const restartGame = async () => {
    if (isGuestMode) {
      // 게스트 모드에서는 회원가입 모달 표시
      onGameComplete?.()
      return
    }

    if (!user) return

    try {
      setIsLoading(true)
      await gameService.restartGame(user.id)
      await initializeGame()
      await loadUserData()
    } catch (error) {
      console.error('Failed to restart game:', error)
      alert('Game restart failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 차트 그리기
  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const dataToShow = gameState.chartData.slice(0, gameState.currentCandleIndex + 1)
    if (dataToShow.length === 0) return

    // 가격 범위 계산
    const prices = dataToShow.flatMap(candle => [candle.high, candle.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice
    const padding = priceRange * 0.1

    // 캔들 그리기
    const candleWidth = width / (dataToShow.length + 1)
    
    dataToShow.forEach((candle, index) => {
      const x = (index + 0.5) * candleWidth
      const openY = height - ((candle.open - minPrice + padding) / (priceRange + 2 * padding)) * height
      const closeY = height - ((candle.close - minPrice + padding) / (priceRange + 2 * padding)) * height
      const highY = height - ((candle.high - minPrice + padding) / (priceRange + 2 * padding)) * height
      const lowY = height - ((candle.low - minPrice + padding) / (priceRange + 2 * padding)) * height

      // 심지 그리기
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, highY)
      ctx.lineTo(x, lowY)
      ctx.stroke()

      // 캔들 몸통 그리기
      const isGreen = candle.close > candle.open
      ctx.fillStyle = isGreen ? '#00ff88' : '#ff4444'
      ctx.strokeStyle = isGreen ? '#00ff88' : '#ff4444'
      ctx.lineWidth = 2

      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.abs(closeY - openY)
      
      if (bodyHeight < 2) {
        // 도지 캔들
        ctx.beginPath()
        ctx.moveTo(x - candleWidth * 0.3, openY)
        ctx.lineTo(x + candleWidth * 0.3, openY)
        ctx.stroke()
      } else {
        ctx.fillRect(x - candleWidth * 0.3, bodyTop, candleWidth * 0.6, bodyHeight)
      }
    })

    // 포지션 정보 표시
    if (gameState.position) {
      const entryY = height - ((gameState.position.entry_price - minPrice + padding) / (priceRange + 2 * padding)) * height
      const liqY = height - ((gameState.position.liquidation_price - minPrice + padding) / (priceRange + 2 * padding)) * height

      // 진입가 라인
      ctx.strokeStyle = '#ffff00'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(0, entryY)
      ctx.lineTo(width, entryY)
      ctx.stroke()

      // 청산가 라인
      ctx.strokeStyle = '#ff0000'
      ctx.beginPath()
      ctx.moveTo(0, liqY)
      ctx.lineTo(width, liqY)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // 추천 링크 복사
  const copyReferralLink = () => {
    if (gameState.referralCode) {
      const link = referralService.generateReferralLink(gameState.referralCode)
      navigator.clipboard.writeText(link)
      alert('추천 링크가 복사되었습니다!')
    }
  }

  // 게스트 모드가 아니고 로그인하지 않은 경우에만 로그인 화면 표시
  if (!user && !isGuestMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">ErrdayCoin</h1>
        <p className="text-xl mb-8">Futures Trading Simulator Game</p>
        <button
          onClick={onShowAuth}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 rounded-lg font-semibold"
        >
          Login to Start
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Bitget 배너 */}
      <BitgetBanner />
      
      {/* HUD */}
      <div className="flex justify-between items-center p-4 bg-gray-800">
        <div className="flex space-x-6">
          <div>
            <span className="text-sm text-gray-400">Retry Tokens</span>
            <div className="text-xl font-bold text-yellow-400">
              {gameState.userTokens?.retry_tokens || 0}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-400">Next Day Uses</span>
            <div className="text-xl font-bold text-blue-400">
              {gameState.nextdayUsesLeft}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm text-gray-400">내 추천코드</span>
            <div 
              className="text-lg font-mono bg-gray-700 px-3 py-1 rounded cursor-pointer hover:bg-gray-600"
              onClick={copyReferralLink}
            >
              {gameState.referralCode || 'Loading...'}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        {/* 게임 제목 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <img 
              src="/logo.jpg" 
              alt="ErrdayCoin Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <h1 className="text-3xl font-bold text-yellow-400">ErrdayCoin</h1>
          </div>
          <p className="text-gray-300">Futures Trading Simulator</p>
          {gameState.session && (
            <p className="text-sm text-gray-400 mt-2">
              {binanceAPI.getDisplayName(gameState.session.symbol)} - {gameState.session.symbol}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 차트 영역 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">차트</h3>
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full border border-gray-600 rounded"
              />
            </div>
          </div>

          {/* 거래 패널 */}
          <div className="space-y-4">
            {/* 포지션 설정 */}
            {!gameState.isPositionOpen && !gameState.gameEnded && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Position Setup</h3>
                
                <div className="space-y-4">
                  {/* Long/Short 선택 */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Direction</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setGameSettings(prev => ({ ...prev, side: 'long' }))}
                        className={`flex-1 py-2 px-4 rounded ${
                          gameSettings.side === 'long' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        Long
                      </button>
                      <button
                        onClick={() => setGameSettings(prev => ({ ...prev, side: 'short' }))}
                        className={`flex-1 py-2 px-4 rounded ${
                          gameSettings.side === 'short' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        Short
                      </button>
                    </div>
                  </div>

                  {/* 레버리지 */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Leverage: {gameSettings.leverage}x
                    </label>
                    <input
                      type="range"
                      min={GAME_CONSTANTS.MIN_LEVERAGE}
                      max={GAME_CONSTANTS.MAX_LEVERAGE}
                      value={gameSettings.leverage}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        leverage: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                  </div>

                  {/* 포지션 비중 */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      포지션 비중: {gameSettings.positionPercentage}%
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={gameSettings.positionPercentage}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        positionPercentage: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-400 mt-1">
                      포지션 크기: {(100 * gameSettings.positionPercentage / 100).toFixed(2)} USDT
                    </div>
                  </div>

                  {/* 청산가 미리보기 */}
                  {gameState.previewData.length > 0 && (
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-sm text-gray-400">Expected Liquidation Price</div>
                      <div className="text-lg font-mono text-red-400">
                        {(() => {
                          const currentCandle = gameState.previewData[gameState.currentCandleIndex - 1] || 
                                              gameState.chartData[gameState.currentCandleIndex - 1];
                          if (!currentCandle) return 'N/A';
                          
                          const currentPrice = currentCandle.close;
                          const liquidationPrice = gameSettings.side === 'long' 
                            ? currentPrice * (1 - 1/gameSettings.leverage)
                            : currentPrice * (1 + 1/gameSettings.leverage);
                          
                          return liquidationPrice.toFixed(2);
                        })()} USDT
                      </div>
                    </div>
                  )}

                  <button
                    onClick={enterPosition}
                    disabled={isLoading}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded disabled:opacity-50"
                  >
                    {isLoading ? '처리중...' : '포지션 진입'}
                  </button>
                </div>
              </div>
            )}

            {/* 포지션 정보 */}
            {gameState.isPositionOpen && gameState.position && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">현재 포지션</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">방향</span>
                    <span className={gameState.position.side === 'long' ? 'text-green-400' : 'text-red-400'}>
                      {gameState.position.side.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">진입가</span>
                    <span className="font-mono">{gameState.position.entry_price.toFixed(2)} USDT</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">레버리지</span>
                    <span>{gameState.position.leverage}x</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">포지션 크기</span>
                    <span className="font-mono">{gameState.position.position_size.toFixed(2)} USDT</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">청산가</span>
                    <span className="font-mono text-red-400">
                      {gameState.position.liquidation_price.toFixed(2)} USDT
                    </span>
                  </div>
                  
                  {gameState.position.current_price && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">현재가</span>
                        <span className="font-mono">{gameState.position.current_price.toFixed(2)} USDT</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">미실현 PNL</span>
                        <span className={`font-mono ${
                          (gameState.position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(gameState.position.unrealized_pnl || 0).toFixed(2)} USDT
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">ROI</span>
                        <span className={`font-mono ${
                          (gameState.position.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(gameState.position.roi || 0).toFixed(2)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {!gameState.gameEnded && (
                    <button
                      onClick={revealNextDay}
                      disabled={isLoading}
                      className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Next Day'}
                    </button>
                  )}
                  
                  <button
                    onClick={closePosition}
                    disabled={isLoading}
                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded disabled:opacity-50"
                  >
                    {isLoading ? '처리중...' : '포지션 종료'}
                  </button>
                </div>
              </div>
            )}

            {/* 게임 종료 */}
            {(gameState.gameEnded || gameState.nextdayUsesLeft === 0) && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Game Over</h3>
                
                {gameState.position && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Final PNL</span>
                      <span className={`font-mono ${
                        (gameState.position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(gameState.position.unrealized_pnl || 0).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final ROI</span>
                      <span className={`font-mono ${
                        (gameState.position.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(gameState.position.roi || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={restartGame}
                  disabled={isLoading}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : (isGuestMode ? 'One More' : 'New Game (Token -1)')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">ErrdayCoin 게임 방법</h3>
            <ul className="space-y-2 text-sm">
              <li>• 과거 차트를 보고 Long/Short 포지션을 선택하세요</li>
              <li>• 레버리지와 포지션 비중을 설정하세요</li>
              <li>• Next Day 버튼으로 다음 캔들을 공개하세요</li>
              <li>• 청산가에 도달하면 100% 손실됩니다</li>
              <li>• 토큰을 사용해서 게임을 재시작할 수 있습니다</li>
              <li>• 친구를 초대하면 토큰을 받을 수 있습니다</li>
            </ul>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full mt-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
            >
              시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
