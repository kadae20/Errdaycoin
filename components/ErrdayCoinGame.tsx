'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  isLiquidated,
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
  balance?: number // 현재 잔액
}

interface GameProps {
  onShowAuth?: () => void
  onGameComplete?: () => void
  isGuestMode?: boolean
}

export default function ErrdayCoinGame({ onShowAuth, onGameComplete, isGuestMode = false }: GameProps) {
  const { user, loginWithGoogle } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // 초기 상태 정의
  const initialChartState = {
    startIndex: 0,  // 표시할 시작 인덱스
    endIndex: 40    // 표시할 끝 인덱스
  }

  const initialGameState: GameState = {
    chartData: [],
    previewData: [],
    currentCandleIndex: 0,
    nextdayUsesLeft: GAME_CONSTANTS.DEFAULT_NEXTDAY_USES,
    isPositionOpen: false,
    isLiquidated: false,
    gameEnded: false,
    balance: 1000, // 초기 잔액
    position: undefined // 초기에는 포지션 없음
  }

  const initialGameSettings = {
    side: 'long' as 'long' | 'short',
    leverage: 10,
    positionPercentage: 10, // 포트폴리오 대비 %
  }

  // 차트 표시 상태 (단순화)
  const [chartState, setChartState] = useState(initialChartState)
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [gameSettings, setGameSettings] = useState(initialGameSettings)

  const [showTutorial, setShowTutorial] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showNoChancesModal, setShowNoChancesModal] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  
  // 게임 데이터 백업 (상태 업데이트 실패 시 사용)
  const gameDataRef = useRef<any>(null)

  // 8자리 추천코드 생성 함수
  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 광고 시청 시뮬레이션 함수
  const simulateAdWatch = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      // 3초 후 광고 시청 완료로 처리
      setTimeout(() => {
        console.log('🎬 Ad watched successfully!')
        resolve(true)
      }, 3000)
    })
  }

  // 광고 시청 후 리필
  const watchAdAndRefill = async () => {
    try {
      setIsLoading(true)
      const adWatched = await simulateAdWatch()
      
      if (adWatched) {
        if (isGuestMode) {
          // 게스트 모드에서 1회 리필
          setGameState(prev => ({
            ...prev,
            userTokens: prev.userTokens ? {
              ...prev.userTokens,
              retry_tokens: prev.userTokens.retry_tokens + 1
            } : {
              user_id: 'guest',
              balance: '1000.00',
              retry_tokens: 1,
              referral_tokens: 0,
              referral_code: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }))
        } else {
          // 로그인 사용자: 서버에 토큰 리필 요청
          try {
            await gameService.refillToken(user!.id, 'ad_watch')
            console.log('✅ Token refilled via ad watch')
            
            // 사용자 데이터 다시 로드
            await loadUserData()
          } catch (error) {
            console.error('Failed to refill token:', error)
            alert('Failed to refill token. Please try again.')
            return
          }
        }
        
        setShowNoChancesModal(false)
        alert('🎬 Ad watched! You got 1 retry token!')
      }
    } catch (error) {
      console.error('Failed to watch ad:', error)
      alert('Failed to watch ad. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // 광고 시청 후 게임 다시 시작 (게임 완료 화면용)
  const watchAdAndPlayAgain = async () => {
    try {
      setIsLoading(true)
      const adWatched = await simulateAdWatch()
      
      if (adWatched) {
        // 게임 상태 초기화 (토큰 차감 없이)
        setGameState(prev => ({
          ...initialGameState,
          userTokens: prev.userTokens ? {
            ...prev.userTokens,
            retry_tokens: 1 // 광고 시청 후 1회 리필
          } : {
            user_id: 'guest',
            balance: '1000.00',
            retry_tokens: 1,
            referral_tokens: 0,
            referral_code: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          balance: 1000 // Balance 리셋
        }))
        setChartState(initialChartState)
        setGameSettings(initialGameSettings)
        
        // localStorage에서 게임 상태 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('errdaycoin-game-state')
        }
        
        // 새 게임 초기화
        await initializeGame()
        
        alert('🎬 Ad watched! Starting new game!')
      }
    } catch (error) {
      console.error('Failed to watch ad:', error)
      alert('Failed to watch ad. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // 게임 상태 저장
  const saveGameState = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stateToSave = {
        gameState,
        gameSettings,
        chartState,
        isGuestMode
      }
      localStorage.setItem('errdaycoin-game-state', JSON.stringify(stateToSave))
    }
  }, [gameState, gameSettings, chartState, isGuestMode])

  // 게임 상태 복원
  const loadGameState = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('errdaycoin-game-state')
        if (savedState) {
          const parsedState = JSON.parse(savedState)
          if (parsedState.isGuestMode === isGuestMode) {
            console.log('🔄 Restoring saved game state')
            setGameState(parsedState.gameState)
            setGameSettings(parsedState.gameSettings)
            setChartState(parsedState.chartState)
            return true
          }
        }
      } catch (error) {
        console.error('Failed to load game state:', error)
      }
    }
    return false
  }, [isGuestMode])

  // 게임 상태 변경 시 저장
  useEffect(() => {
    if (gameState.chartData.length > 0) {
      saveGameState()
    }
  }, [gameState, saveGameState])

  // 게임 초기화
  useEffect(() => {
    const initializeGameAsync = async () => {
      console.log('🎮 Game initialization useEffect triggered:', { user: !!user, isGuestMode })
      
      if (user || isGuestMode) {
        // 먼저 저장된 상태가 있는지 확인
        const hasRestoredState = loadGameState()
        
        if (!hasRestoredState) {
          console.log('✅ No saved state, calling initializeGame...')
          await initializeGame()
          if (user) {
            await loadUserData()
          }
        } else {
          console.log('✅ Restored saved game state')
          if (user) {
            await loadUserData()
          }
        }
      } else {
        console.log('❌ Conditions not met for game initialization')
      }
    }
    
    initializeGameAsync()
  }, [user, isGuestMode, loadGameState])

  // Canvas 마운트 확인
  useEffect(() => {
    if (canvasRef.current) {
      console.log('🖼️ Canvas mounted:', {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        clientWidth: canvasRef.current.clientWidth,
        clientHeight: canvasRef.current.clientHeight
      })
    }
  }, [])

  // 게임 상태 변경 시 차트 다시 그리기
  useEffect(() => {
    console.log('🔄 Game state useEffect triggered:', {
      chartDataLength: gameState.chartData.length,
      currentCandleIndex: gameState.currentCandleIndex,
      hasPosition: !!gameState.position
    })
    
    if (gameState.chartData.length > 0) {
      console.log('✅ Chart data available, drawing chart...')
      drawChart()
    } else {
      console.log('❌ No chart data available yet')
    }
  }, [gameState.chartData, gameState.currentCandleIndex, gameState.position])

  // 차트 줌 상태 변경 시 다시 그리기
  useEffect(() => {
    if (gameState.chartData.length > 0) {
      console.log('🔄 Chart state changed, redrawing...', {
        startIndex: chartState.startIndex,
        endIndex: chartState.endIndex,
        chartDataLength: gameState.chartData.length
      })
      drawChart()
    }
  }, [chartState.startIndex, chartState.endIndex])

  // Next Day 기능 추가
  const handleNextDay = () => {
    if (gameState.nextdayUsesLeft <= 0) {
      // Next Day 사용 횟수가 모두 소진되면 게임 종료
      setGameState(prev => ({
        ...prev,
        gameEnded: true
      }))
      return
    }

    if (gameState.currentCandleIndex >= gameState.chartData.length - 1) {
      alert('No more data available!')
      return
    }

    console.log('📅 Next day clicked, current index:', gameState.currentCandleIndex)
    
    const newCandleIndex = Math.min(gameState.currentCandleIndex + 1, gameState.chartData.length - 1)
    
    // 차트 범위도 함께 업데이트 (새로운 캔들이 보이도록)
    const newEndIndex = Math.min(newCandleIndex + 1, gameState.chartData.length)
    const newStartIndex = Math.max(0, newEndIndex - 40) // 40개 캔들 유지
    
    // Next Day Uses 소진 시 미결제 포지션 자동 정리
    const isLastDay = gameState.nextdayUsesLeft - 1 <= 0
    let finalBalance = gameState.balance || 1000
    
    // 마지막 날이고 포지션이 열려있으면 자동으로 정리
    if (isLastDay && gameState.isPositionOpen && gameState.position) {
      const newCandle = gameState.chartData[newCandleIndex]
      if (newCandle) {
        const currentPrice = newCandle.close
        const realizedPnl = calculatePNL(
          gameState.position.entry_price,
          currentPrice,
          gameState.position.side,
          gameState.position.position_size
        )
        finalBalance = (gameState.balance || 1000) + realizedPnl // 현재 잔액 + 실현 PNL (수익 유지)
        console.log('🏁 Auto-closing position on game end:', {
          entryPrice: gameState.position.entry_price,
          closePrice: currentPrice,
          realizedPnl,
          finalBalance
        })
      }
    }

    setGameState(prev => ({
      ...prev,
      currentCandleIndex: newCandleIndex,
      nextdayUsesLeft: prev.nextdayUsesLeft - 1,
      gameEnded: isLastDay,
      // 마지막 날에 포지션 자동 정리
      isPositionOpen: isLastDay ? false : prev.isPositionOpen,
      position: isLastDay ? undefined : prev.position,
      balance: isLastDay ? finalBalance : prev.balance
    }))

    setChartState(prev => ({
      ...prev,
      startIndex: newStartIndex,
      endIndex: newEndIndex
    }))

    // 포지션이 열려있으면 PNL 업데이트 및 청산 확인
    if (gameState.isPositionOpen && gameState.position) {
      const newCandle = gameState.chartData[newCandleIndex]
      if (newCandle) {
        const currentPrice = newCandle.close
        const unrealizedPnl = calculatePNL(
          gameState.position.entry_price,
          currentPrice,
          gameState.position.side,
          gameState.position.position_size
        )
        const roi = calculateROI(
          gameState.position.entry_price,
          currentPrice,
          gameState.position.side,
          gameState.position.leverage
        )
        
        // 청산 여부 확인
        const isLiquidatedNow = isLiquidated(
          currentPrice,
          gameState.position.liquidation_price,
          gameState.position.side
        )
        
        if (isLiquidatedNow) {
          console.log('💥 Position liquidated!')
          // 청산 처리 - Balance를 1000으로 리셋
          setGameState(prev => ({
            ...prev,
            isPositionOpen: false,
            isLiquidated: true,
            gameEnded: true,
            balance: 1000, // 청산 시 Balance 리셋
            position: prev.position ? {
              ...prev.position,
              current_price: currentPrice,
              unrealized_pnl: -prev.position.position_size, // 전액 손실
              roi: -100
            } : prev.position
          }))
        } else {
          // 포지션 정보 업데이트 및 Balance 실시간 반영
          setGameState(prev => ({
            ...prev,
            position: prev.position ? {
              ...prev.position,
              current_price: currentPrice,
              unrealized_pnl: unrealizedPnl,
              roi: roi
            } : prev.position,
            // Balance 실시간 반영: 초기 잔고 + 미실현 PNL
            balance: 1000 + unrealizedPnl
          }))
        }
      }
    }

    // 차트 즉시 다시 그리기
    setTimeout(() => {
      const chartData = gameState.chartData.length > 0 ? gameState.chartData : (gameDataRef.current?.full_data || [])
      if (chartData.length > 0) {
        console.log('🎯 Drawing chart with new candle:', { newCandleIndex, newStartIndex, newEndIndex })
        drawChartWithData(chartData, newCandleIndex, newStartIndex, newEndIndex)
      }
    }, 0)
  }

  const initializeGame = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // 게스트 모드에서는 더미 데이터로 게임 시작
      if (isGuestMode) {
        console.log('🎮 Initializing guest mode...')
        const gameData = await binanceAPI.getRandomGameChart()
        console.log('📊 Game data received:', {
          symbol: gameData.symbol,
          fullDataLength: gameData.full_data.length,
          previewLength: gameData.preview_candles.length,
          firstCandle: gameData.full_data[0],
          lastCandle: gameData.full_data[gameData.full_data.length - 1]
        })
        
        // 게임 데이터 백업 저장
        gameDataRef.current = gameData
        const newState = {
          ...gameState,
          chartData: gameData.full_data,
          previewData: gameData.preview_candles,
          currentCandleIndex: gameData.preview_candles.length - 1,  // 인덱스는 0부터 시작하므로 -1
          nextdayUsesLeft: isGuestMode ? 15 : GAME_CONSTANTS.DEFAULT_NEXTDAY_USES,
          isPositionOpen: false,
          isLiquidated: false,
          gameEnded: false,
          // Balance 유지 (기존 balance가 있으면 유지, 없으면 1000으로 초기화)
          balance: gameState.balance || 1000,
          // 게스트 모드에서 userTokens 초기화 (기존 토큰이 있으면 유지)
          userTokens: isGuestMode ? (gameState.userTokens || {
            user_id: 'guest',
            balance: '1000.00',
            retry_tokens: 1, // 게스트 모드는 1회만
            referral_tokens: 0,
            referral_code: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }) : gameState.userTokens
        }
        
        console.log('🔄 Setting new game state:', {
          chartDataLength: newState.chartData.length,
          previewDataLength: newState.previewData.length,
          currentCandleIndex: newState.currentCandleIndex
        })
        
        setGameState(newState)
        
        // 차트 표시 상태 초기화 - 프리뷰 데이터 기준으로 설정
        const initialEndIndex = Math.min(40, gameData.preview_candles.length)
        console.log('🎯 Initializing chart state:', {
          startIndex: 0,
          endIndex: initialEndIndex,
          previewLength: gameData.preview_candles.length,
          fullLength: gameData.full_data.length,
          currentCandleIndex: gameData.preview_candles.length - 1
        })

        setChartState({
          startIndex: 0,
          endIndex: initialEndIndex
        })
        
        console.log('✅ Game state updated for guest mode')
        setIsLoading(false)  // 게스트 모드에서도 로딩 상태 해제
        
        // 게스트 모드에서 즉시 차트 그리기 (상태 업데이트 완료 후)
        setTimeout(() => {
          console.log('🎨 Drawing chart for guest mode with direct data...')
          // 상태가 아직 업데이트되지 않았을 수 있으므로 직접 데이터 전달
          drawChartWithData(gameData.full_data, gameData.preview_candles.length - 1, 0, initialEndIndex)
        }, 200)  // 더 긴 지연으로 상태 업데이트 보장
        
        // 추가적으로 상태 강제 업데이트 확인
        setTimeout(() => {
          console.log('🔄 Checking game state after initialization:', {
            chartDataLength: gameState.chartData.length,
            hasData: gameState.chartData.length > 0
          })
          if (gameState.chartData.length === 0) {
            console.log('⚠️ Game state not updated, forcing manual update...')
            setGameState(prev => ({
              ...prev,
              chartData: gameData.full_data,
              previewData: gameData.preview_candles,
              currentCandleIndex: gameData.preview_candles.length - 1
            }))
          }
        }, 500)
        
        return
      }

      // 로그인 사용자도 게스트 모드와 동일한 랜덤 차트 데이터 사용
      console.log('🎮 Initializing logged-in user mode with random chart...')
      const gameData = await binanceAPI.getRandomGameChart()
      console.log('📊 Game data received for logged-in user:', {
        symbol: gameData.symbol,
        fullDataLength: gameData.full_data.length,
        previewLength: gameData.preview_candles.length
      })
      
      // 게임 데이터 백업 저장
      gameDataRef.current = gameData
      
      setGameState(prev => ({
        ...prev,
        chartData: gameData.full_data,
        previewData: gameData.preview_candles,
        currentCandleIndex: gameData.preview_candles.length - 1,
        nextdayUsesLeft: GAME_CONSTANTS.DEFAULT_NEXTDAY_USES,
        gameEnded: false,
        isLiquidated: false,
        isPositionOpen: false,
        // 로그인 모드: 서버에서 가져온 잔액 사용 (수익 유지)
        balance: prev.userTokens?.balance ? parseFloat(prev.userTokens.balance) : (prev.balance || 1000)
      }))
      
      // 차트 표시 상태 초기화 - 프리뷰 데이터 기준으로 설정
      const initialEndIndex = Math.min(40, gameData.preview_candles.length)
      setChartState({
        startIndex: 0,
        endIndex: initialEndIndex
      })
      
      // 차트 렌더링
      setTimeout(() => {
        drawChartWithData(gameData.full_data, gameData.preview_candles.length - 1, 0, initialEndIndex)
      }, 200)
    } catch (error) {
      console.error('Failed to initialize game:', error)
      alert('Game initialization failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [isGuestMode, user])

  const loadUserData = async () => {
    try {
      console.log('🔄 Loading user data for:', user?.id)
      
      // 사용자 데이터 로드 (자동으로 새 사용자 생성됨)
      const [tokens, referralCode] = await Promise.all([
        gameService.getUserTokens(user!.id),
        referralService.getUserReferralCode(user!.id)
      ])
      
      console.log('📊 User data received:', {
        tokens,
        referralCode
      })
      
      setGameState(prev => ({
        ...prev,
        userTokens: tokens,
        referralCode: referralCode,
        // 서버에서 가져온 잔액으로 업데이트 (수익 유지)
        balance: parseFloat(tokens.balance)
      }))
      
      console.log('✅ User data loaded successfully:', {
        retryTokens: tokens.retry_tokens,
        referralCode: referralCode
      })
    } catch (error) {
      console.error('❌ Failed to load user data:', error)
      
      // 에러 발생 시 클라이언트에서 추천코드 생성
      try {
        const fallbackReferralCode = generateReferralCode()
        console.log('🔄 Generated fallback referral code:', fallbackReferralCode)
        
        setGameState(prev => ({
          ...prev,
          userTokens: {
            user_id: user!.id,
            balance: '1000.00',
            retry_tokens: 15,
            referral_tokens: 0,
            referral_code: fallbackReferralCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          referralCode: fallbackReferralCode
        }))
      } catch (fallbackError) {
        console.error('❌ Failed to generate fallback referral code:', fallbackError)
        // 최후의 수단으로 랜덤 코드 생성
        const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
        setGameState(prev => ({
          ...prev,
          userTokens: {
            user_id: user!.id,
            balance: '1000.00',
            retry_tokens: 15,
            referral_tokens: 0,
            referral_code: randomCode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          referralCode: randomCode
        }))
      }
    }
  }

  // 포지션 진입 (추가매수 지원)
  const enterPosition = async (side?: 'long' | 'short') => {
    if (!isGuestMode && !user) return

    try {
      setIsLoading(true)
      // 현재 캔들의 종가 사용 (진입은 현재 캔들 종가 기준)
      const currentPrice = gameState.previewData[gameState.currentCandleIndex]?.close || 
                          gameState.chartData[gameState.currentCandleIndex]?.close
      
      if (!currentPrice) {
        alert('Cannot get current price')
        return
      }

      // 사이드 결정 (파라미터가 있으면 사용, 없으면 설정값 사용)
      const positionSide = side || gameSettings.side

      // 게스트 모드에서는 클라이언트에서만 처리
      if (isGuestMode) {
        const positionSize = (gameSettings.positionPercentage / 100) * (gameState.balance || 1000)
        
        // 기존 포지션이 있으면 추가매수 처리
        if (gameState.isPositionOpen && gameState.position) {
          // 같은 방향일 때만 추가매수 허용
          if (gameState.position.side !== positionSide) {
            alert('Cannot add position in opposite direction! Close current position first.')
            return
          }

          // 교차 마진: 수익이 날 때만 추가매수 허용
          const currentPnl = calculatePNL(
            gameState.position.entry_price,
            currentPrice,
            gameState.position.side,
            gameState.position.position_size
          )
          
          if (currentPnl <= 0) {
            alert('Additional entry only allowed when position is in profit (Cross Margin)')
            return
          }

          // 사용 가능한 마진 = 기본 잔고 + 현재 수익
          const availableMargin = 1000 + currentPnl
          const additionalNotionalValue = positionSize * gameSettings.leverage
          const maxAdditionalNotional = (availableMargin - gameState.position.position_size) * gameSettings.leverage
          
          if (additionalNotionalValue > maxAdditionalNotional) {
            alert(`Maximum additional size: ${(maxAdditionalNotional / gameSettings.leverage).toFixed(2)} USDT (Available margin: ${availableMargin.toFixed(2)} USDT)`)
            return
          }

          // 기존 포지션과 새 포지션의 평균 진입가 계산
          const existingValue = gameState.position.entry_price * gameState.position.position_size
          const newValue = currentPrice * additionalNotionalValue
          const totalNotionalSize = gameState.position.position_size + additionalNotionalValue
          const avgEntryPrice = (existingValue + newValue) / totalNotionalSize

          // 새로운 청산가 계산
          const liquidationPrice = calculateLiquidationPrice(
            avgEntryPrice,
            gameSettings.leverage,
            positionSide,
            1000, // 교차 마진 모드 잔고
            totalNotionalSize
          )

          const updatedPosition: Position = {
            ...gameState.position,
            entry_price: avgEntryPrice,
            position_size: totalNotionalSize,
            liquidation_price: liquidationPrice,
            leverage: gameSettings.leverage, // 레버리지도 업데이트
            current_price: currentPrice,
            // PNL과 ROI 재계산
            unrealized_pnl: calculatePNL(avgEntryPrice, currentPrice, positionSide, totalNotionalSize),
            roi: calculateROI(avgEntryPrice, currentPrice, positionSide, gameSettings.leverage)
          }

          setGameState(prev => ({
            ...prev,
            position: updatedPosition
          }))

          console.log('📈 Position scaled up:', {
            oldSize: gameState.position.position_size,
            newSize: totalNotionalSize,
            avgEntry: avgEntryPrice,
            newLiquidation: liquidationPrice
          })

          drawChart()
          return
        }

        // 새 포지션 생성 - 포지션 사이즈는 레버리지를 곱한 실제 노셔널 값
        const notionalValue = positionSize * gameSettings.leverage
        const liquidationPrice = calculateLiquidationPrice(
          currentPrice,
          gameSettings.leverage,
          positionSide,
          1000, // 교차 마진 모드 잔고
          notionalValue
        )

        const newPosition: Position = {
          id: 'guest-position',
          user_id: 'guest',
          session_id: 'guest-session',
          side: positionSide,
          leverage: gameSettings.leverage,
          position_size: notionalValue, // 실제 노셔널 값 (1000 * 10 = 10,000)
          entry_price: currentPrice,
          liquidation_price: liquidationPrice,
          current_price: currentPrice,
          unrealized_pnl: 0,
          roi: 0
        }

        setGameState(prev => ({
          ...prev,
          position: newPosition,
          isPositionOpen: true
        }))

        drawChart()
        return
      }

      // 로그인 모드도 게스트 모드와 동일한 로직 사용
      const positionSize = (gameSettings.positionPercentage / 100) * (gameState.balance || 1000)
      
      // 기존 포지션이 있으면 추가매수 처리
      if (gameState.isPositionOpen && gameState.position) {
        // 같은 방향일 때만 추가매수 허용
        if (gameState.position.side !== positionSide) {
          alert('Cannot add position in opposite direction! Close current position first.')
          return
        }

        // 교차 마진: 수익이 날 때만 추가매수 허용
        const currentPnl = calculatePNL(
          gameState.position.entry_price,
          currentPrice,
          gameState.position.side,
          gameState.position.position_size
        )
        
        if (currentPnl <= 0) {
          alert('Additional entry only allowed when position is in profit (Cross Margin)')
          return
        }

        // 사용 가능한 마진 = 기본 잔고 + 현재 수익
        const availableMargin = 1000 + currentPnl
        const additionalNotionalValue = positionSize * gameSettings.leverage
        const maxAdditionalNotional = (availableMargin - gameState.position.position_size) * gameSettings.leverage
        
        if (additionalNotionalValue > maxAdditionalNotional) {
          alert(`Maximum additional size: ${(maxAdditionalNotional / gameSettings.leverage).toFixed(2)} USDT (Available margin: ${availableMargin.toFixed(2)} USDT)`)
          return
        }

        // 기존 포지션과 새 포지션의 평균 진입가 계산
        const existingValue = gameState.position.entry_price * gameState.position.position_size
        const newValue = currentPrice * additionalNotionalValue
        const totalNotionalSize = gameState.position.position_size + additionalNotionalValue
        const avgEntryPrice = (existingValue + newValue) / totalNotionalSize

        // 새로운 청산가 계산
        const liquidationPrice = calculateLiquidationPrice(
          avgEntryPrice,
          gameSettings.leverage,
          positionSide,
          1000, // 교차 마진 모드 잔고
          totalNotionalSize
        )

        const updatedPosition: Position = {
          ...gameState.position,
          entry_price: avgEntryPrice,
          position_size: totalNotionalSize,
          liquidation_price: liquidationPrice,
          leverage: gameSettings.leverage, // 레버리지도 업데이트
          current_price: currentPrice,
          // PNL과 ROI 재계산
          unrealized_pnl: calculatePNL(avgEntryPrice, currentPrice, positionSide, totalNotionalSize),
          roi: calculateROI(avgEntryPrice, currentPrice, positionSide, gameSettings.leverage)
        }

        setGameState(prev => ({
          ...prev,
          position: updatedPosition,
          isPositionOpen: true
        }))

        drawChart()
        return
      }

      // 새 포지션 생성 - 포지션 사이즈는 레버리지를 곱한 실제 노셔널 값
      const notionalValue = positionSize * gameSettings.leverage
      const liquidationPrice = calculateLiquidationPrice(
        currentPrice,
        gameSettings.leverage,
        positionSide,
        1000, // 교차 마진 모드 잔고
        notionalValue
      )

      const newPosition: Position = {
        id: `position-${user?.id}`,
        user_id: user?.id,
        session_id: `session-${user?.id}`,
        side: positionSide,
        leverage: gameSettings.leverage,
        position_size: notionalValue, // 실제 노셔널 값 (1000 * 10 = 10,000)
        entry_price: currentPrice,
        liquidation_price: liquidationPrice,
        current_price: currentPrice,
        unrealized_pnl: 0,
        roi: 0
      }

      setGameState(prev => ({
        ...prev,
        position: newPosition,
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
        
        // PNL 계산: 가격 변화율 × 레버리지 × 마진 (포지션 사이즈 / 레버리지)
        const margin = gameState.position.position_size / gameState.position.leverage
        const newPnl = priceDiff * gameState.position.leverage * margin
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
          gameEnded: isLiquidated || prev.nextdayUsesLeft <= 1,
          // Balance 실시간 반영: 초기 잔고 + 미실현 PNL
          balance: isLiquidated ? 1000 : 1000 + newPnl
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
        gameState.position.side,
        gameState.position.position_size
      )

      const roi = calculateROI(
        gameState.position.entry_price,
        nextPrice,
        gameState.position.side,
        gameState.position.leverage
      )

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
  const closePosition = async (closePercentage: number = 100) => {
    if (!gameState.position) return

    try {
      setIsLoading(true)
      const currentPrice = gameState.position.current_price || gameState.position.entry_price
      
      // 부분 종료 계산
      const closeSize = (gameState.position.position_size * closePercentage) / 100
      const remainingSize = gameState.position.position_size - closeSize
      
      // 실현 PNL 계산
      const realizedPnl = calculatePNL(
        gameState.position.entry_price,
        currentPrice,
        gameState.position.side,
        closeSize
      )
      
      console.log('💰 Position partially closed:', {
        closePercentage,
        closeSize,
        remainingSize,
        realizedPnl
      })

      if (closePercentage >= 100 || remainingSize <= 0) {
        // 전체 종료
        if (!isGuestMode && gameState.session && user) {
          await gameService.closePosition(gameState.session.id, currentPrice)
        }
        
        setGameState(prev => ({
          ...prev,
          position: undefined, // 포지션 완전 제거
          isPositionOpen: false,
          // Next Day Uses가 남아있으면 게임 계속, 다 쓰면 게임 종료
          gameEnded: prev.nextdayUsesLeft <= 0,
          // 잔액 업데이트: 실현 PNL을 Balance에 반영
          balance: (prev.balance || 1000) + realizedPnl
        }))

        const remainingDays = gameState.nextdayUsesLeft
        if (remainingDays > 0) {
          alert(`Position fully closed! Realized PNL: ${realizedPnl.toFixed(2)} USDT\n\nYou have ${remainingDays} Next Day Uses remaining. You can open a new position!`)
        } else {
          alert(`Position fully closed! Realized PNL: ${realizedPnl.toFixed(2)} USDT\n\nGame completed! Check your final results.`)
        }
      } else {
        // 부분 종료
        const updatedPosition = {
          ...gameState.position,
          position_size: remainingSize,
          current_price: currentPrice,
          // 청산가 재계산 (포지션 크기가 줄어들었으므로)
          liquidation_price: calculateLiquidationPrice(
            gameState.position.entry_price,
            gameState.position.leverage,
            gameState.position.side,
            1000, // 교차 마진 모드 잔고
            remainingSize
          ),
          // 미실현 PNL 재계산
          unrealized_pnl: calculatePNL(
            gameState.position.entry_price,
            currentPrice,
            gameState.position.side,
            remainingSize
          ),
          roi: calculateROI(
            gameState.position.entry_price,
            currentPrice,
            gameState.position.side,
            gameState.position.leverage
          )
        }

        setGameState(prev => ({
          ...prev,
          position: updatedPosition,
          // 잔액 업데이트: 실현 PNL을 Balance에 반영
          balance: (prev.balance || 1000) + realizedPnl
        }))

        alert(`${closePercentage}% position closed! Realized PNL: ${realizedPnl.toFixed(2)} USDT`)
      }
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
      // 게스트 모드에서도 Retry Token 확인 및 차감
      const currentRetryTokens = gameState.userTokens?.retry_tokens || 1
      if (currentRetryTokens <= 0) {
        setShowNoChancesModal(true)
        return
      }
      
      console.log('🎮 Restarting game in guest mode, consuming retry token')
      
      // 현재 잔액 확인 (수익이 있으면 유지)
      const currentBalance = gameState.balance || 1000
      const shouldMaintainBalance = currentBalance > 1000
      
      // 게임 상태 초기화 (토큰 차감, 수익 시 잔액 유지)
      setGameState(prev => ({
        ...initialGameState,
        balance: shouldMaintainBalance ? currentBalance : 1000, // 수익이 있으면 잔액 유지
        userTokens: prev.userTokens ? {
          ...prev.userTokens,
          retry_tokens: prev.userTokens.retry_tokens - 1
        } : {
          user_id: 'guest',
          balance: shouldMaintainBalance ? currentBalance.toFixed(2) : '1000.00',
          retry_tokens: 0, // 1에서 1 차감
          referral_tokens: 0,
          referral_code: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }))
      setChartState(initialChartState)
      setGameSettings(initialGameSettings)
      
      // localStorage에서 게임 상태 제거
      if (typeof window !== 'undefined') {
        localStorage.removeItem('errdaycoin-game-state')
      }
      
      await initializeGame()
      return
    }

    if (!user) return

    // 로그인 사용자는 토큰 확인
    if (!gameState.userTokens || gameState.userTokens.retry_tokens <= 0) {
      setShowNoChancesModal(true)
      return
    }

    try {
      setIsLoading(true)
      console.log('🔄 Restarting game for user:', user.id)
      
      // 현재 잔액 확인 (수익이 있으면 유지)
      const currentBalance = gameState.balance || 1000
      const shouldMaintainBalance = currentBalance > 1000
      
      // 서버에 토큰 차감 요청
      await gameService.restartGame(user.id)
      console.log('✅ Token consumed on server')
      
      // 게임 상태 초기화 (수익 시 잔액 유지)
      setGameState(prev => ({
        ...initialGameState,
        userTokens: prev.userTokens ? {
          ...prev.userTokens,
          balance: shouldMaintainBalance ? currentBalance.toFixed(2) : '1000.00'
        } : undefined,
        // 수익이 있으면 잔액 유지, 없으면 1000으로 리셋
        balance: shouldMaintainBalance ? currentBalance : 1000
      }))
      setChartState(initialChartState)
      setGameSettings(initialGameSettings)
      
      // localStorage에서 게임 상태 제거
      if (typeof window !== 'undefined') {
        localStorage.removeItem('errdaycoin-game-state')
      }
      
      // 새 게임 초기화
      await initializeGame()
      
      // 사용자 데이터 다시 로드 (서버에서 업데이트된 토큰 정보 포함)
      await loadUserData()
      
      console.log('🎮 Game restarted successfully')
    } catch (error) {
      console.error('Failed to restart game:', error)
      alert('Game restart failed: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 데이터를 직접 전달받아 차트 그리기
  const drawChartWithData = useCallback((chartData: any[], currentCandleIndex: number, startIndex: number, endIndex: number) => {
    console.log('🎨 drawChartWithData called with direct data')
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('❌ Canvas not found')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('❌ Canvas context not found')
      return
    }

    const { width, height } = canvas
    console.log('📐 Canvas dimensions:', { width, height })
    
    // 배경 색상 설정 (알파스퀘어 스타일)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)

    console.log('🔍 Direct data parameters:', {
      chartDataLength: chartData.length,
      currentCandleIndex,
      startIndex,
      endIndex
    })
    
    // 차트 데이터가 없으면 조기 종료
    if (chartData.length === 0) {
      console.error('❌ No chart data available in direct data')
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Loading chart data...', width / 2, height / 2)
      return
    }
    
    // 현재 캔들 인덱스가 유효하지 않으면 전체 데이터 사용
    const validCurrentIndex = Math.max(0, Math.min(currentCandleIndex, chartData.length - 1))
    const availableData = chartData.slice(0, validCurrentIndex + 1)
    
    console.log('📋 Available data after slice:', {
      availableDataLength: availableData.length,
      validCurrentIndex,
      originalCurrentIndex: currentCandleIndex,
      totalChartData: chartData.length,
      firstAvailable: availableData[0],
      lastAvailable: availableData[availableData.length - 1]
    })
    
    // 사용 가능한 데이터가 없으면 조기 종료
    if (availableData.length === 0) {
      console.error('❌ No available data after slicing')
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Loading chart data...', width / 2, height / 2)
      return
    }
    
    // 차트 상태가 초기화되지 않은 경우 기본값 설정
    const safeStartIndex = Math.max(0, startIndex)
    const safeEndIndex = endIndex > 0 ? endIndex : Math.min(40, availableData.length)
    
    const actualStartIndex = Math.min(safeStartIndex, Math.max(0, availableData.length - 1))
    const actualEndIndex = Math.min(safeEndIndex, availableData.length)
    const dataToShow = availableData.slice(actualStartIndex, actualEndIndex)
    
    console.log('🎯 Final slice calculation:', {
      safeStartIndex,
      safeEndIndex,
      actualStartIndex,
      actualEndIndex,
      dataToShowLength: dataToShow.length
    })
    
    if (dataToShow.length === 0) {
      console.error('❌ No chart data to display after final slice')
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Loading chart data...', width / 2, height / 2)
      return
    }

    // 가격 범위 계산
    const prices = dataToShow.flatMap(candle => [candle.high, candle.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice
    const padding = priceRange * 0.1

    console.log('💰 Price range:', { minPrice, maxPrice, priceRange, padding })

    // 가격 그리드 그리기 (알파스퀘어 스타일)
    const gridLines = 8
    const rightMargin = 80 // 가격 레이블을 위한 여백
    const chartWidth = width - rightMargin
    
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.font = '12px Arial'
    ctx.fillStyle = '#888'
    
    for (let i = 0; i <= gridLines; i++) {
      const y = (height / gridLines) * i
      const price = maxPrice + padding - ((maxPrice + padding - (minPrice - padding)) * (i / gridLines))
      
      // 수평 그리드 라인
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(chartWidth, y)
      ctx.stroke()
      
      // 가격 레이블
      ctx.textAlign = 'left'
      ctx.fillText(price.toFixed(2), chartWidth + 5, y + 4)
    }
    
    // 세로 그리드 라인 (시간)
    const timeGridLines = Math.min(10, dataToShow.length)
    if (timeGridLines > 1) {
      for (let i = 0; i <= timeGridLines; i++) {
        const x = (chartWidth / timeGridLines) * i
        
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
    }

    // 캔들 그리기 - 차트 영역에 맞춰 조정
    const candleWidth = Math.max(chartWidth / (dataToShow.length + 2), 2) // 최소 2px 폭 보장
    console.log('📏 Candle width:', candleWidth, 'for', dataToShow.length, 'candles')
    
    console.log('🕯️ Starting to draw', dataToShow.length, 'candles')
    
    dataToShow.forEach((candle, index) => {
      const x = (index + 1) * (chartWidth / (dataToShow.length + 1))
      const actualIndex = actualStartIndex + index
      
      const openY = height - ((candle.open - minPrice + padding) / (priceRange + 2 * padding)) * height
      const closeY = height - ((candle.close - minPrice + padding) / (priceRange + 2 * padding)) * height
      const highY = height - ((candle.high - minPrice + padding) / (priceRange + 2 * padding)) * height
      const lowY = height - ((candle.low - minPrice + padding) / (priceRange + 2 * padding)) * height

      // 현재 캔들 인덱스를 넘어서는 미래 데이터인지 확인
      const isFutureData = actualIndex > currentCandleIndex
      
      // 심지 그리기 (알파스퀘어 스타일)
      ctx.strokeStyle = isFutureData ? '#555' : '#888'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, highY)
      ctx.lineTo(x, lowY)
      ctx.stroke()

      // 캔들 몸통 그리기 (알파스퀘어 스타일 색상)
      const isGreen = candle.close > candle.open
      if (isFutureData) {
        // 미래 데이터는 회색으로 표시
        ctx.fillStyle = '#444'
        ctx.strokeStyle = '#444'
      } else {
        // 현재/과거 데이터는 알파스퀘어 스타일 색상
        ctx.fillStyle = isGreen ? '#26a69a' : '#ef5350'  // 더 부드러운 색상
        ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350'
      }

      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.abs(closeY - openY)
      const candleBodyWidth = Math.max(candleWidth * 0.6, 1)
      
      if (bodyHeight < 1) {
        // 도지 캔들 - 더 얇은 라인
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x - candleBodyWidth / 2, openY)
        ctx.lineTo(x + candleBodyWidth / 2, openY)
        ctx.stroke()
      } else {
        // 캔들 몸통 - 알파스퀘어 스타일
        if (isGreen) {
          // 상승 캔들은 테두리만
          ctx.lineWidth = 1
          ctx.strokeRect(x - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight)
        } else {
          // 하락 캔들은 채움
          ctx.fillRect(x - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight)
        }
      }
    })
    
    console.log('✅ Chart rendering completed with direct data!')
  }, [])


  // 차트 그리기
  const drawChart = useCallback(() => {
    console.log('🎨 drawChart called')
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('❌ Canvas not found')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('❌ Canvas context not found')
      return
    }

    const { width, height } = canvas
    console.log('📐 Canvas dimensions:', { width, height })
    
    // 배경 색상 설정 (알파스퀘어 스타일)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)

    // 줌 상태에 따른 데이터 범위 계산
    console.log('🔍 Raw game state:', {
      chartDataLength: gameState.chartData.length,
      currentCandleIndex: gameState.currentCandleIndex,
      chartStateStartIndex: chartState.startIndex,
      chartStateEndIndex: chartState.endIndex
    })
    
    // 차트 데이터가 없으면 백업 데이터 사용
    let chartData = gameState.chartData
    let currentCandleIndex = gameState.currentCandleIndex
    
    if (chartData.length === 0 && gameDataRef.current) {
      console.log('⚠️ Using backup game data from ref')
      chartData = gameDataRef.current.full_data
      currentCandleIndex = gameDataRef.current.preview_candles.length - 1
    }
    
    if (chartData.length === 0) {
      console.error('❌ No chart data available in gameState or backup')
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Loading chart data...', width / 2, height / 2)
      return
    }
    
    // 현재 캔들 인덱스가 유효하지 않으면 전체 데이터 사용
    const validCurrentIndex = Math.max(0, Math.min(currentCandleIndex, chartData.length - 1))
    const availableData = chartData.slice(0, validCurrentIndex + 1)
    
    console.log('📋 Available data after slice:', {
      availableDataLength: availableData.length,
      validCurrentIndex,
      originalCurrentIndex: currentCandleIndex,
      totalChartData: chartData.length,
      firstAvailable: availableData[0],
      lastAvailable: availableData[availableData.length - 1]
    })
    
    // 사용 가능한 데이터가 없으면 조기 종료
    if (availableData.length === 0) {
      console.error('❌ No available data after slicing')
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Loading chart data...', width / 2, height / 2)
      return
    }
    
    // 차트 상태가 초기화되지 않은 경우 기본값 설정
    const safeStartIndex = Math.max(0, chartState.startIndex || 0)
    const safeEndIndex = (chartState.endIndex > 0) ? chartState.endIndex : Math.min(40, availableData.length)
    
    const actualStartIndex = Math.min(safeStartIndex, Math.max(0, availableData.length - 1))
    const actualEndIndex = Math.min(safeEndIndex, availableData.length)
    const dataToShow = availableData.slice(actualStartIndex, actualEndIndex)
    
    console.log('🎯 Final slice calculation:', {
      safeStartIndex,
      safeEndIndex,
      actualStartIndex,
      actualEndIndex,
      dataToShowLength: dataToShow.length
    })
    
    console.log('📊 Chart data to show:', {
      totalCandles: gameState.chartData.length,
      currentIndex: gameState.currentCandleIndex,
      availableCandles: availableData.length,
      zoomStart: actualStartIndex,
      zoomEnd: actualEndIndex,
      candlesToShow: dataToShow.length,
      firstCandle: dataToShow[0],
      lastCandle: dataToShow[dataToShow.length - 1]
    })
    
    if (dataToShow.length === 0) {
      console.error('❌ No chart data to display')
      // 데이터가 없을 때 메시지 표시
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Loading chart data...', width / 2, height / 2)
      return
    }

    // 가격 범위 계산
    console.log('🔍 First candle in dataToShow:', dataToShow[0])
    const prices = dataToShow.flatMap(candle => [candle.high, candle.low])
    console.log('📈 Extracted prices:', prices.slice(0, 10)) // 처음 10개만 로깅
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice
    const padding = priceRange * 0.1

    console.log('💰 Price range:', { minPrice, maxPrice, priceRange, padding })

    // 가격 그리드 그리기 (알파스퀘어 스타일)
    const gridLines = 8
    const rightMargin = 80 // 가격 레이블을 위한 여백
    const chartWidth = width - rightMargin
    
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.font = '12px Arial'
    ctx.fillStyle = '#888'
    
    for (let i = 0; i <= gridLines; i++) {
      const y = (height / gridLines) * i
      const price = maxPrice + padding - ((maxPrice + padding - (minPrice - padding)) * (i / gridLines))
      
      // 수평 그리드 라인
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(chartWidth, y)
      ctx.stroke()
      
      // 가격 레이블
      ctx.textAlign = 'left'
      ctx.fillText(price.toFixed(2), chartWidth + 5, y + 4)
    }
    
    // 세로 그리드 라인 (시간)
    const timeGridLines = Math.min(10, dataToShow.length)
    if (timeGridLines > 1) {
      for (let i = 0; i <= timeGridLines; i++) {
        const x = (chartWidth / timeGridLines) * i
        
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
    }

    // 캔들 그리기 - 차트 영역에 맞춰 조정
    const candleWidth = Math.max(chartWidth / (dataToShow.length + 2), 2) // 최소 2px 폭 보장
    console.log('📏 Candle width:', candleWidth, 'for', dataToShow.length, 'candles')
    
    console.log('🕯️ Starting to draw', dataToShow.length, 'candles')
    
    dataToShow.forEach((candle, index) => {
      const x = (index + 1) * (chartWidth / (dataToShow.length + 1))
      const actualIndex = actualStartIndex + index
      
      const openY = height - ((candle.open - minPrice + padding) / (priceRange + 2 * padding)) * height
      const closeY = height - ((candle.close - minPrice + padding) / (priceRange + 2 * padding)) * height
      const highY = height - ((candle.high - minPrice + padding) / (priceRange + 2 * padding)) * height
      const lowY = height - ((candle.low - minPrice + padding) / (priceRange + 2 * padding)) * height

      // 현재 캔들 인덱스를 넘어서는 미래 데이터인지 확인
      const isFutureData = actualIndex > currentCandleIndex
      
      // 심지 그리기 (알파스퀘어 스타일)
      ctx.strokeStyle = isFutureData ? '#555' : '#888'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, highY)
      ctx.lineTo(x, lowY)
      ctx.stroke()

      // 캔들 몸통 그리기 (알파스퀘어 스타일 색상)
      const isGreen = candle.close > candle.open
      if (isFutureData) {
        // 미래 데이터는 회색으로 표시
        ctx.fillStyle = '#444'
        ctx.strokeStyle = '#444'
      } else {
        // 현재/과거 데이터는 알파스퀘어 스타일 색상
        ctx.fillStyle = isGreen ? '#26a69a' : '#ef5350'  // 더 부드러운 색상
        ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350'
      }

      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.abs(closeY - openY)
      const candleBodyWidth = Math.max(candleWidth * 0.6, 1)
      
      if (bodyHeight < 1) {
        // 도지 캔들 - 더 얇은 라인
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x - candleBodyWidth / 2, openY)
        ctx.lineTo(x + candleBodyWidth / 2, openY)
        ctx.stroke()
      } else {
        // 캔들 몸통 - 알파스퀘어 스타일
        if (isGreen) {
          // 상승 캔들은 테두리만
          ctx.lineWidth = 1
          ctx.strokeRect(x - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight)
        } else {
          // 하락 캔들은 채움
          ctx.fillRect(x - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight)
        }
      }
    })
    
    console.log('✅ Chart rendering completed!')

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
  }, [gameState.chartData, gameState.currentCandleIndex, gameState.position, chartState.startIndex, chartState.endIndex])

  // 차트 줌 상태 변경 시 다시 그리기
  useEffect(() => {
    if (gameState.chartData.length > 0 || gameDataRef.current) {
      console.log('🔄 Zoom state changed, redrawing chart...', {
        startIndex: chartState.startIndex,
        endIndex: chartState.endIndex
      })
      drawChart()
    }
  }, [chartState.startIndex, chartState.endIndex, drawChart])

  // 추천 링크 복사
  const copyReferralLink = () => {
    const referralCode = gameState.userTokens?.referral_code || gameState.referralCode
    if (referralCode) {
      const link = referralService.generateReferralLink(referralCode)
      navigator.clipboard.writeText(link)
      alert('추천 링크가 복사되었습니다!')
    } else {
      alert('추천코드를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
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
            <span className="text-sm text-gray-400">
              {isGuestMode ? 'Guest Chances' : 'Retry Tokens'}
            </span>
            <div className={`text-xl font-bold ${
              (gameState.userTokens?.retry_tokens || (isGuestMode ? 1 : 0)) > 0 
                ? 'text-yellow-400' 
                : 'text-red-400'
            }`}>
              {gameState.userTokens?.retry_tokens || (isGuestMode ? 1 : 0)}
              {isGuestMode && (
                <span className="text-xs text-gray-500 ml-1">/1</span>
              )}
            </div>
            {isGuestMode && (gameState.userTokens?.retry_tokens || 1) === 0 && (
              <div className="text-xs text-red-400">Watch ad or sign up!</div>
            )}
          </div>
          <div>
            <span className="text-sm text-gray-400">Balance</span>
            <div className="text-xl font-bold text-green-400">
              {(gameState.balance || 1000).toFixed(2)} USDT
            </div>
          </div>
        </div>
        
        {/* 사용자 상태 인디케이터 */}
        <div className="flex items-center space-x-4">
          {/* 로그인 상태 표시 */}
          <div className="flex items-center space-x-2">
            {isGuestMode ? (
              <div className="flex items-center space-x-2 bg-orange-500/20 border border-orange-500/30 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-orange-300">Guest Mode</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-green-300">Logged In</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-gray-500/20 border border-gray-500/30 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-300">Not Logged In</span>
              </div>
            )}
          </div>
          
          {/* 사용자 정보 (로그인된 경우) */}
          {user && !isGuestMode && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-sm">
                <div className="text-gray-300 font-medium">
                  {user.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {gameState.userTokens?.retry_tokens || 0} retry tokens
                </div>
              </div>
            </div>
          )}
        </div>
        
        {!isGuestMode && (
        <div className="flex items-center space-x-4">
          <div>
              <span className="text-sm text-gray-400">My Referral Code</span>
            <div 
              className="text-lg font-mono bg-gray-700 px-3 py-1 rounded cursor-pointer hover:bg-gray-600"
              onClick={copyReferralLink}
            >
              {gameState.userTokens?.referral_code || gameState.referralCode || 'Loading...'}
            </div>
          </div>
        </div>
        )}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 차트 영역 */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Chart</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span className="text-xs">
                    Next Day Uses: {gameState.nextdayUsesLeft}
                  </span>
                  <button
                    onClick={handleNextDay}
                    disabled={gameState.nextdayUsesLeft <= 0 || gameState.currentCandleIndex >= gameState.chartData.length - 1}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs font-medium"
                  >
                    Next Day
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                📊 Chart showing {chartState.endIndex - chartState.startIndex} candles
              </div>
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
            {/* Position Setup */}
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

                  {/* Leverage */}
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

                  {/* Position Size */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Position Size: {gameSettings.positionPercentage}%
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
                      Position Amount: {(gameSettings.positionPercentage / 100 * (gameState.balance || 1000) * gameSettings.leverage).toFixed(2)} USDT
                    </div>
                  </div>

                  {/* Expected Liquidation Price */}
                  {gameState.previewData.length > 0 && (
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-sm text-gray-400">Expected Liquidation Price</div>
                      <div className="text-lg font-mono text-red-400">
                        {(() => {
                          const currentCandle = gameState.previewData[gameState.currentCandleIndex - 1] || 
                                              gameState.chartData[gameState.currentCandleIndex - 1];
                          if (!currentCandle) return 'N/A';
                          
                          const currentPrice = currentCandle.close;
                          const positionSize = (gameSettings.positionPercentage / 100) * (gameState.balance || 1000)
                          const liquidationPrice = calculateLiquidationPrice(
                            currentPrice,
                            gameSettings.leverage,
                            gameSettings.side,
                            gameState.balance || 1000, // 실제 잔액 사용
                            positionSize
                          )
                          
                          return liquidationPrice.toFixed(2);
                        })()} USDT
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => enterPosition(gameSettings.side)}
                    disabled={isLoading}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Enter Position'}
                  </button>
                </div>
              </div>
            )}

            {/* 포지션 조절 (포지션이 있을 때만) */}
            {gameState.isPositionOpen && gameState.position && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Adjust Position</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-700 p-3 rounded">
                    {/* 레버리지 조절 */}
                    <div className="mb-3">
                      <label className="text-sm text-gray-400">Leverage: {gameSettings.leverage}x</label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={gameSettings.leverage}
                        onChange={(e) => setGameSettings(prev => ({
                          ...prev, 
                          leverage: parseInt(e.target.value) 
                        }))}
                        className="w-full mt-1"
                      />
                    </div>
                    
                    {/* 비중 조절 */}
                    <div className="mb-3">
                      <label className="text-sm text-gray-400">Position Size: {gameSettings.positionPercentage}%</label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={gameSettings.positionPercentage}
                        onChange={(e) => setGameSettings(prev => ({
                          ...prev, 
                          positionPercentage: parseInt(e.target.value) 
                        }))}
                        className="w-full mt-1"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Amount: {(gameSettings.positionPercentage / 100 * 1000).toFixed(2)} USDT
                      </div>
                    </div>
                  </div>

                  {/* 추가 진입 버튼들 */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => enterPosition('long')}
                      disabled={isLoading || (gameState.position && (gameState.position.unrealized_pnl || 0) <= 0)}
                      className="py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded disabled:opacity-50"
                      title={gameState.position && (gameState.position.unrealized_pnl || 0) <= 0 ? "Additional entry only allowed when in profit" : ""}
                    >
                      {gameState.position?.side === 'long' ? 'Add Long' : 'Long'}
                    </button>
                    <button
                      onClick={() => enterPosition('short')}
                      disabled={isLoading || (gameState.position && (gameState.position.unrealized_pnl || 0) <= 0)}
                      className="py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded disabled:opacity-50"
                      title={gameState.position && (gameState.position.unrealized_pnl || 0) <= 0 ? "Additional entry only allowed when in profit" : ""}
                    >
                      {gameState.position?.side === 'short' ? 'Add Short' : 'Short'}
                    </button>
                  </div>
                  
                  {/* 포지션 종료 옵션 */}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Close Position</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => closePosition(25)}
                        disabled={isLoading}
                        className="py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded disabled:opacity-50"
                      >
                        25%
                      </button>
                      <button
                        onClick={() => closePosition(50)}
                        disabled={isLoading}
                        className="py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded disabled:opacity-50"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => closePosition(75)}
                        disabled={isLoading}
                        className="py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded disabled:opacity-50"
                      >
                        75%
                      </button>
                      <button
                        onClick={() => closePosition(100)}
                        disabled={isLoading}
                        className="py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded disabled:opacity-50"
                      >
                        100%
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 청산 모달 */}
            {gameState.isLiquidated && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💥</div>
                    <h2 className="text-2xl font-bold text-red-400 mb-2">LIQUIDATED!</h2>
                    <p className="text-gray-300 mb-4">Your position has been liquidated</p>
                    
                    {gameState.position && (
                      <div className="bg-gray-700 rounded p-4 mb-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Final PNL</span>
                            <span className="font-mono text-red-400">
                              {(gameState.position.unrealized_pnl || 0).toFixed(2)} USDT
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Final ROI</span>
                            <span className="font-mono text-red-400">
                              {(gameState.position.roi || 0).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isGuestMode && (
                      <div className="bg-blue-600 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-center mb-2">
                          <span className="text-2xl mr-2">🎁</span>
                          <span className="font-semibold">Get 15 Retry Tokens!</span>
                        </div>
                        <p className="text-sm text-blue-100 mb-3">
                          Login with Google to get 15 retry tokens and save your progress
                        </p>
                        <button
                          onClick={() => loginWithGoogle()}
                          className="w-full py-2 bg-white text-blue-600 font-semibold rounded hover:bg-gray-100 flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Login with Google
                        </button>
                      </div>
                    )}

                    <button
                      onClick={restartGame}
                      disabled={isLoading}
                      className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : (isGuestMode ? 'Try Again' : 'Try Again (Token -1)')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 게임 완료 모달 - 프리미엄 디자인 */}
            {(gameState.gameEnded && !gameState.isLiquidated) && (
              <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl border border-gray-700 max-w-lg w-full overflow-hidden">
                  {/* 배경 그라데이션 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-green-600/10 opacity-50"></div>
                  
                  {/* 상단 장식 라인 */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>
                  
                  <div className="relative p-8">
                    {/* 헤더 섹션 */}
                    <div className="text-center mb-8">
                      <div className="relative inline-block">
                        <div className="text-7xl mb-4 animate-bounce">🏆</div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
                      </div>
                      <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                        TRADING COMPLETE
                      </h2>
                      <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full mb-4"></div>
                      <p className="text-gray-300 text-lg">Session Results</p>
                    </div>
                    
                    {/* 성과 카드 */}
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-600/50">
                      <div className="grid grid-cols-2 gap-6">
                        {/* 시작 잔액 */}
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-1">Starting</div>
                          <div className="text-2xl font-bold text-white">1,000</div>
                          <div className="text-xs text-gray-500">USDT</div>
                        </div>
                        
                        {/* 최종 잔액 */}
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-1">Final</div>
                          <div className={`text-2xl font-bold ${
                            (gameState.balance || 1000) >= 1000 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {(gameState.balance || 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-gray-500">USDT</div>
                        </div>
                      </div>
                      
                      {/* 구분선 */}
                      <div className="my-6 border-t border-gray-600/50"></div>
                      
                      {/* P&L 및 ROI */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Total P&L</span>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              ((gameState.balance || 1000) - 1000) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {((gameState.balance || 1000) - 1000) >= 0 ? '+' : ''}
                              {((gameState.balance || 1000) - 1000).toFixed(0)} USDT
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Total ROI</span>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              ((gameState.balance || 1000) - 1000) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {((gameState.balance || 1000) - 1000) >= 0 ? '+' : ''}
                              {(((gameState.balance || 1000) - 1000) / 1000 * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 미결제 포지션 (있는 경우) */}
                    {gameState.position && gameState.isPositionOpen && (
                      <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-orange-500/30">
                        <div className="flex items-center mb-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-orange-300 font-semibold">Open Position</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Unrealized PNL</div>
                            <div className={`font-mono font-bold ${
                              (gameState.position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {(gameState.position.unrealized_pnl || 0) >= 0 ? '+' : ''}
                              {(gameState.position.unrealized_pnl || 0).toFixed(2)} USDT
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">ROI</div>
                            <div className={`font-mono font-bold ${
                              (gameState.position.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {(gameState.position.roi || 0) >= 0 ? '+' : ''}
                              {(gameState.position.roi || 0).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Google 로그인 프로모션 (게스트 모드) */}
                    {isGuestMode && (
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 relative overflow-hidden border-2 border-yellow-400/30">
                        {/* 반짝이는 효과 */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 animate-pulse"></div>
                        
                        <div className="relative">
                          <div className="flex items-center justify-center mb-4">
                            <div className="text-4xl mr-3 animate-bounce">🎁</div>
                            <div className="text-center">
                              <div className="text-white font-bold text-xl">Premium Upgrade</div>
                              <div className="text-yellow-200 text-sm font-semibold">Unlock Daily Rewards!</div>
                            </div>
                          </div>
                          
                          {/* 혜택 설명 */}
                          <div className="bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm">
                            <div className="text-center text-white mb-3">
                              <div className="text-lg font-bold mb-2">🚀 Get 15 Retry Tokens EVERY DAY!</div>
                              <div className="text-sm text-blue-100 space-y-1">
                                <div>• Daily reset at midnight (US time)</div>
                                <div>• Save your progress permanently</div>
                                <div>• Access to leaderboards & stats</div>
                                <div>• No more guest limitations!</div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => loginWithGoogle()}
                            className="w-full py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <div className="text-left">
                              <div className="text-lg">Continue with Google</div>
                              <div className="text-sm text-gray-600">Get 15 tokens daily!</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <button
                      onClick={isGuestMode ? watchAdAndPlayAgain : restartGame}
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          {isGuestMode ? 'Watching Ad...' : 'Processing...'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="mr-2">{isGuestMode ? '🎬' : '🚀'}</span>
                          {isGuestMode ? 'Watch Ad & Play Again' : 'New Game'}
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 포지션 테이블 - 실제 선물거래 플랫폼 스타일 */}
        <div className="mt-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Positions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 font-medium text-gray-400">Type</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-400">Size</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-400">Entry Price</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-400">Market Price</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-400">Liq. Price</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-400">Unrealized P/L</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {gameState.isPositionOpen && gameState.position ? (
                    <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-2">
                        <span className={`font-bold ${
                          gameState.position.side === 'long' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {gameState.position.side?.toUpperCase()} {gameState.position.leverage}x
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono">
                        ${gameState.position.position_size?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-2 font-mono">
                        ${gameState.position.entry_price?.toFixed(3) || '0.000'}
                      </td>
                      <td className="py-3 px-2 font-mono">
                        {gameState.position.current_price ? 
                          `$${gameState.position.current_price.toFixed(3)}` : 
                          `$${gameState.position.entry_price?.toFixed(3) || '0.000'}`
                        }
                      </td>
                      <td className="py-3 px-2 font-mono text-red-400">
                        ${gameState.position.liquidation_price?.toFixed(2) || '0.00'}
                      </td>
                      <td className={`py-3 px-2 font-mono ${
                        (gameState.position.unrealized_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(gameState.position.unrealized_pnl || 0) >= 0 ? '+' : ''}
                        ${(gameState.position.unrealized_pnl || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => closePosition(100)}
                          disabled={isLoading}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No open positions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 기회 소진 모달 */}
      {showNoChancesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl border border-gray-700 max-w-lg w-full overflow-hidden">
            {/* 상단 장식 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
            
            <div className="relative p-8">
              {/* 헤더 */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">😢</div>
                <h2 className="text-3xl font-bold text-red-400 mb-2">No More Chances!</h2>
                <p className="text-gray-300">You've used all your retry tokens</p>
              </div>
              
              {/* 선택지 */}
              <div className="space-y-4">
                {/* 광고 보기 옵션 */}
                <button
                  onClick={watchAdAndRefill}
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Watching Ad...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🎬</span>
                      <div className="text-left">
                        <div className="text-lg">Watch Ad</div>
                        <div className="text-sm text-blue-100">Get 1 retry token</div>
                      </div>
                    </div>
                  )}
                </button>
                
                {/* 친구 초대하기 옵션 - 로그인된 사용자에게만 표시 */}
                {user && (
                  <button
                    onClick={() => {
                      setShowNoChancesModal(false)
                      // 친구 초대 모달 열기
                      setShowReferralModal(true)
                    }}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    <span className="text-2xl mr-3">👥</span>
                    <div className="text-left">
                      <div className="text-lg">Invite a friend</div>
                      <div className="text-sm text-green-100">Get 3 chances + 3 limit increase</div>
                    </div>
                  </button>
                )}
                
                {/* 구글 로그인 옵션 - 게스트 사용자에게만 표시 */}
                {!user && (
                  <button
                    onClick={() => {
                      setShowNoChancesModal(false)
                      loginWithGoogle()
                    }}
                    className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-lg">Sign up with Google</div>
                      <div className="text-sm text-gray-600">Get 15 tokens daily!</div>
                    </div>
                  </button>
                )}
              </div>
              
              {/* 혜택 설명 */}
              <div className="mt-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
                <div className="text-center text-white">
                  <div className="text-sm font-semibold mb-2">🚀 Premium Benefits</div>
                  <div className="text-xs text-blue-100 space-y-1">
                    <div>• 15 retry tokens every day at midnight</div>
                    <div>• Save progress permanently</div>
                    <div>• Access to leaderboards & statistics</div>
                    <div>• No more limitations!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 친구 초대 모달 */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl border border-gray-700 max-w-lg w-full overflow-hidden">
            {/* 상단 장식 라인 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
            
            <div className="relative p-8">
              {/* 헤더 */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">👥</div>
                <h2 className="text-3xl font-bold text-green-400 mb-2">Invite a Friend</h2>
                <p className="text-gray-300">Share your referral code and both get rewards!</p>
              </div>
              
              {/* 추천 코드 표시 */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-600">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Your Referral Code</div>
                  <div className="text-2xl font-bold text-green-400 font-mono tracking-wider">
                    {gameState.referralCode || 'GENERATING...'}
                  </div>
                  <button
                    onClick={() => {
                      if (gameState.referralCode) {
                        navigator.clipboard.writeText(`${window.location.origin}/play?ref=${gameState.referralCode}`)
                        alert('Referral link copied to clipboard!')
                      }
                    }}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Copy referral link
                  </button>
                </div>
              </div>
              
              {/* 보상 설명 */}
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/30 mb-6">
                <div className="text-center text-white">
                  <div className="text-sm font-semibold mb-3">🎁 Rewards for Both</div>
                  <div className="text-xs text-green-100 space-y-2">
                    <div className="flex justify-between">
                      <span>• You get:</span>
                      <span className="font-bold">+3 chances + 3 limit increase</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Friend gets:</span>
                      <span className="font-bold">+3 chances + 3 limit increase</span>
                    </div>
                    <div className="text-center text-green-300 font-semibold mt-2">
                      Win-Win for everyone! 🚀
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 버튼들 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReferralModal(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (gameState.referralCode) {
                      const shareText = `Join me in this amazing crypto trading game! Use my referral code: ${gameState.referralCode}`
                      const shareUrl = `${window.location.origin}/play?ref=${gameState.referralCode}`
                      
                      if (navigator.share) {
                        navigator.share({
                          title: 'Crypto Trading Game',
                          text: shareText,
                          url: shareUrl
                        })
                      } else {
                        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
                        alert('Referral message copied to clipboard!')
                      }
                    }
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">How to Play ErrdayCoin</h3>
            <ul className="space-y-2 text-sm">
              <li>• View historical charts and select Long/Short position</li>
              <li>• Set leverage and position size percentage</li>
              <li>• Use Next Day button to reveal the next candle</li>
              <li>• Reaching liquidation price results in 100% loss</li>
              <li>• Use tokens to restart the game</li>
              <li>• Invite friends to earn more tokens</li>
            </ul>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full mt-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
            >
              Start Game
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
