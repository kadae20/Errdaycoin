'use client'

import { useEffect, useRef, useState } from 'react'
import { Candle } from '@/lib/types'

// Lazy load the chart library
const ChartPreview = ({ 
  previewCandles, 
  revealCandles, 
  symbol,
  className = ''
}: {
  previewCandles: Candle[]
  revealCandles?: Candle[]
  symbol: string
  className?: string
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initChart = async () => {
      try {
        // Lazy load the chart library
        const { createChart } = await import('lightweight-charts')
        
        if (!mounted || !chartContainerRef.current) return

        // Create chart
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 300,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
          },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
          },
          crosshair: {
            mode: 1, // Normal crosshair
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

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#10b981',
          wickDownColor: '#ef4444',
          wickUpColor: '#10b981',
        })

        // Set initial data
        const chartData = previewCandles.map(candle => ({
          time: candle.t / 1000, // Convert to seconds
          open: candle.o,
          high: candle.h,
          low: candle.l,
          close: candle.c,
        }))

        candlestickSeries.setData(chartData as any)

        // Fit content
        chart.timeScale().fitContent()

        chartRef.current = { chart, series: candlestickSeries }
        setIsLoading(false)

        // Handle resize
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
      } catch (err) {
        console.error('Chart initialization error:', err)
        setError('Failed to load chart')
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
  }, [previewCandles])

  // Handle reveal animation
  useEffect(() => {
    if (revealCandles && chartRef.current) {
      const { series } = chartRef.current
      
      // Add reveal candles with animation
      const allCandles = [...previewCandles, ...revealCandles]
      const chartData = allCandles.map(candle => ({
        time: candle.t / 1000,
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
      }))

      series.setData(chartData as any)
      
      // Fit content to show all data
      setTimeout(() => {
        chartRef.current?.chart.timeScale().fitContent()
      }, 100)
    }
  }, [revealCandles, previewCandles])

  if (error) {
    return (
      <div className={`flex items-center justify-center h-[300px] bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Loading chart...</p>
          </div>
        </div>
      )}
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{symbol}</h3>
      </div>
      <div 
        ref={chartContainerRef} 
        className="w-full h-[300px] border border-gray-200 rounded-lg"
      />
    </div>
  )
}

export default ChartPreview
