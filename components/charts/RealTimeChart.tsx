'use client'

import { useState, useEffect, useRef } from 'react'
import { binanceAPI, CandleData } from '@/lib/services/binance-api'

interface RealTimeChartProps {
  symbol?: string
  interval?: string
  height?: number
}

const RealTimeChart = ({ 
  symbol = 'BTCUSDT', 
  interval = '1m', 
  height = 400 
}: RealTimeChartProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // 차트 초기화
  useEffect(() => {
    let mounted = true

    const initChart = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // 차트 라이브러리 동적 로드
        const { createChart } = await import('lightweight-charts')
        
        if (!mounted || !chartContainerRef.current) return

        // 기존 차트 제거
        if (chartRef.current) {
          chartRef.current.chart.remove()
        }

        // 새 차트 생성
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
          },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
          },
          crosshair: {
            mode: 1,
          },
          rightPriceScale: {
            borderColor: '#cccccc',
            scaleMargins: {
              top: 0.1,
              bottom: 0.2,
            },
          },
          timeScale: {
            borderColor: '#cccccc',
            timeVisible: true,
            secondsVisible: false,
          },
        })

        // 캔들스틱 시리즈 추가
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#10b981',
          wickDownColor: '#ef4444',
          wickUpColor: '#10b981',
        })

        // 거래량 시리즈 추가
        const volumeSeries = chart.addHistogramSeries({
          color: '#6b7280',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        })

        // 거래량을 하단에 표시
        chart.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        })

        // 과거 데이터 로드
        const historicalData = await binanceAPI.getKlines(symbol, interval, 100)
        
        if (!mounted) return

        const candleData = historicalData.map(candle => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }))

        const volumeData = historicalData.map(candle => ({
          time: candle.time,
          value: candle.volume,
          color: candle.close >= candle.open ? '#10b981' : '#ef4444',
        }))

        candlestickSeries.setData(candleData)
        volumeSeries.setData(volumeData)

        // 현재 가격 설정
        if (historicalData.length > 0) {
          const lastCandle = historicalData[historicalData.length - 1]
          setCurrentPrice(lastCandle.close)
          
          if (historicalData.length > 1) {
            const prevCandle = historicalData[historicalData.length - 2]
            setPriceChange(((lastCandle.close - prevCandle.close) / prevCandle.close) * 100)
          }
        }

        chart.timeScale().fitContent()

        chartRef.current = { 
          chart, 
          candlestickSeries, 
          volumeSeries,
          data: historicalData 
        }

        // 리사이즈 핸들러
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
          }
        }

        window.addEventListener('resize', handleResize)
        setIsLoading(false)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (chartRef.current) {
            chartRef.current.chart.remove()
          }
        }

      } catch (error) {
        console.error('Chart initialization error:', error)
        setError('차트를 로드할 수 없습니다')
        setIsLoading(false)
      }
    }

    initChart()

    return () => {
      mounted = false
      if (chartRef.current) {
        chartRef.current.chart.remove()
      }
    }
  }, [symbol, interval, height])

  // WebSocket 실시간 연결
  useEffect(() => {
    if (!chartRef.current) return

    try {
      // 기존 WebSocket 연결 해제
      if (wsRef.current) {
        wsRef.current.close()
      }

      // 새 WebSocket 연결
      const ws = binanceAPI.createWebSocket(
        symbol,
        interval,
        (newCandle: CandleData) => {
          if (!chartRef.current) return

          const { candlestickSeries, volumeSeries, data } = chartRef.current
          
          // 데이터 업데이트
          const candlePoint = {
            time: newCandle.time,
            open: newCandle.open,
            high: newCandle.high,
            low: newCandle.low,
            close: newCandle.close,
          }

          const volumePoint = {
            time: newCandle.time,
            value: newCandle.volume,
            color: newCandle.close >= newCandle.open ? '#10b981' : '#ef4444',
          }

          // 마지막 캔들 업데이트 또는 새 캔들 추가
          if (data.length > 0 && data[data.length - 1].time === newCandle.time) {
            // 기존 캔들 업데이트
            candlestickSeries.update(candlePoint)
            volumeSeries.update(volumePoint)
            data[data.length - 1] = newCandle
          } else {
            // 새 캔들 추가
            candlestickSeries.update(candlePoint)
            volumeSeries.update(volumePoint)
            data.push(newCandle)
            
            // 데이터가 너무 많으면 오래된 것 제거
            if (data.length > 200) {
              data.shift()
            }
          }

          // 현재 가격 및 변동률 업데이트
          setCurrentPrice(newCandle.close)
          if (data.length > 1) {
            const prevClose = data[data.length - 2].close
            setPriceChange(((newCandle.close - prevClose) / prevClose) * 100)
          }
        },
        (error) => {
          console.error('WebSocket error:', error)
          setIsConnected(false)
          setError('실시간 연결이 끊어졌습니다')
        }
      )

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      ws.onclose = () => {
        setIsConnected(false)
      }

      wsRef.current = ws

    } catch (error) {
      console.error('WebSocket connection error:', error)
      setError('실시간 연결에 실패했습니다')
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [symbol, interval])

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: price > 1 ? 2 : 6
    })
  }

  const displayName = binanceAPI.getDisplayName(symbol)

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">😵</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">차트 로드 실패</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {displayName} ({symbol})
            </h3>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-2xl font-bold text-gray-800">
                ${formatPrice(currentPrice)}
              </span>
              <span className={`text-lg font-medium ${
                priceChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {isConnected ? '실시간 연결' : '연결 끊김'}
            </div>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">실시간 차트 로딩 중...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className={`w-full ${isLoading ? 'opacity-50' : ''}`}
          style={{ height: `${height}px` }}
        />
      </div>

      {/* 푸터 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            📊 바이낸스 실시간 데이터 • {interval} 간격
          </div>
          <div>
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeChart
