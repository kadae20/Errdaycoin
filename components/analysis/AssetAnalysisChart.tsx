'use client'

import { useState, useEffect, useRef } from 'react'
import { Asset } from '@/lib/types/market'

interface AssetAnalysisChartProps {
  asset: Asset
}

const AssetAnalysisChart = ({ asset }: AssetAnalysisChartProps) => {
  const [timeframe, setTimeframe] = useState('1D')
  const [isLoading, setIsLoading] = useState(true)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  const timeframes = [
    { key: '1D', label: '1일' },
    { key: '1W', label: '1주' },
    { key: '1M', label: '1개월' },
    { key: '3M', label: '3개월' },
    { key: '1Y', label: '1년' },
  ]

  useEffect(() => {
    let mounted = true

    const initChart = async () => {
      try {
        setIsLoading(true)
        
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
          height: 400,
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

        // 이동평균선 추가
        const ma20Series = chart.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
          title: 'MA20',
        })

        const ma50Series = chart.addLineSeries({
          color: '#f59e0b',
          lineWidth: 2,
          title: 'MA50',
        })

        // 거래량 시리즈 추가
        const volumeSeries = chart.addHistogramSeries({
          color: '#6b7280',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        })

        // 별도 스케일에 거래량 표시
        chart.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        })

        // 샘플 데이터 생성
        const { candleData, ma20Data, ma50Data, volumeData } = generateAnalysisData(asset.symbol, timeframe)
        
        candlestickSeries.setData(candleData)
        ma20Series.setData(ma20Data)
        ma50Series.setData(ma50Data)
        volumeSeries.setData(volumeData)

        // AI 분석 마커 추가
        const markers = generateAnalysisMarkers(candleData)
        candlestickSeries.setMarkers(markers)

        chart.timeScale().fitContent()

        chartRef.current = { 
          chart, 
          candlestickSeries, 
          ma20Series, 
          ma50Series, 
          volumeSeries 
        }
        setIsLoading(false)

        // 리사이즈 핸들러
        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          chart.remove()
        }
      } catch (error) {
        console.error('Chart initialization error:', error)
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
  }, [asset.symbol, timeframe])

  // 샘플 데이터 생성 함수
  const generateAnalysisData = (symbol: string, timeframe: string) => {
    const basePrice = symbol.includes('BTC') ? 45000 : 
                     symbol.includes('ETH') ? 3000 :
                     symbol === 'AAPL' ? 180 :
                     symbol === 'TSLA' ? 250 : 500

    const dataPoints = timeframe === '1D' ? 24 : 
                      timeframe === '1W' ? 7 : 
                      timeframe === '1M' ? 30 : 
                      timeframe === '3M' ? 90 : 365

    const candleData = []
    const ma20Data = []
    const ma50Data = []
    const volumeData = []
    
    let currentPrice = basePrice
    const now = Date.now()
    const interval = timeframe === '1D' ? 3600000 : 86400000

    const prices = []

    for (let i = dataPoints; i >= 0; i--) {
      const time = Math.floor((now - (i * interval)) / 1000)
      const volatility = 0.02
      const change = (Math.random() - 0.5) * 2 * volatility
      
      const open = currentPrice
      const close = currentPrice * (1 + change)
      const high = Math.max(open, close) * (1 + Math.random() * 0.01)
      const low = Math.min(open, close) * (1 - Math.random() * 0.01)
      const volume = Math.floor(Math.random() * 1000000) + 100000

      candleData.push({ time, open, high, low, close })
      volumeData.push({ time, value: volume, color: close > open ? '#10b981' : '#ef4444' })
      
      prices.push(close)
      currentPrice = close

      // 이동평균 계산
      if (prices.length >= 20) {
        const ma20 = prices.slice(-20).reduce((sum, p) => sum + p, 0) / 20
        ma20Data.push({ time, value: ma20 })
      }

      if (prices.length >= 50) {
        const ma50 = prices.slice(-50).reduce((sum, p) => sum + p, 0) / 50
        ma50Data.push({ time, value: ma50 })
      }
    }

    return { candleData, ma20Data, ma50Data, volumeData }
  }

  // AI 분석 마커 생성
  const generateAnalysisMarkers = (candleData: any[]) => {
    const markers = []
    const markerCount = Math.min(3, Math.floor(candleData.length / 10))

    for (let i = 0; i < markerCount; i++) {
      const index = Math.floor(Math.random() * candleData.length)
      const candle = candleData[index]
      const isBuy = Math.random() > 0.5

      markers.push({
        time: candle.time,
        position: isBuy ? 'belowBar' : 'aboveBar',
        color: isBuy ? '#10b981' : '#ef4444',
        shape: isBuy ? 'arrowUp' : 'arrowDown',
        text: isBuy ? 'AI 매수 신호' : 'AI 매도 신호',
      })
    }

    return markers
  }

  // 현재 가격 (샘플)
  const currentPrice = asset.symbol.includes('BTC') ? 45234.56 : 
                      asset.symbol.includes('ETH') ? 3012.34 :
                      asset.symbol === 'AAPL' ? 182.45 :
                      asset.symbol === 'TSLA' ? 248.90 : 512.34

  const priceChange = (Math.random() - 0.5) * 10
  const priceChangePercent = (priceChange / currentPrice) * 100

  return (
    <div className="space-y-6">
      {/* 종목 정보 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {asset.symbol} - {asset.name_ko || asset.name}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-2xl font-bold text-gray-800">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-lg font-medium ${
              priceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">AI 추천</div>
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            📈 매수 (신뢰도 87%)
          </div>
        </div>
      </div>

      {/* 차트 컨트롤 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeframe === tf.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">MA20</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-500"></div>
            <span className="text-gray-600">MA50</span>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">차트 로딩 중...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full h-[400px] border border-gray-200 rounded-lg"
        />
      </div>

      {/* AI 분석 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">📊 기술적 분석</h4>
          <p className="text-sm text-blue-700">
            상승 삼각형 패턴이 형성되고 있으며, RSI가 과매도 구간에서 반등하고 있습니다.
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">💭 감정 분석</h4>
          <p className="text-sm text-green-700">
            최근 뉴스 감정이 긍정적으로 전환되었으며, 소셜미디어 언급량이 증가하고 있습니다.
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-purple-800 mb-2">🔍 패턴 분석</h4>
          <p className="text-sm text-purple-700">
            과거 유사한 패턴에서 70% 확률로 상승 전환이 발생했습니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AssetAnalysisChart
