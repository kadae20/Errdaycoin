'use client'

import { useState } from 'react'
import RealTimeChart from '@/components/charts/RealTimeChart'

const QuickChart = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')
  const [interval, setInterval] = useState('1m')

  const symbols = [
    { symbol: 'BTCUSDT', name: '비트코인' },
    { symbol: 'ETHUSDT', name: '이더리움' },
    { symbol: 'BNBUSDT', name: '바이낸스코인' },
    { symbol: 'ADAUSDT', name: '카르다노' },
    { symbol: 'SOLUSDT', name: '솔라나' },
  ]

  const intervals = [
    { key: '1m', label: '1분' },
    { key: '5m', label: '5분' },
    { key: '15m', label: '15분' },
    { key: '1h', label: '1시간' },
    { key: '4h', label: '4시간' },
    { key: '1d', label: '1일' },
  ]

  return (
    <div className="space-y-4">
      {/* 컨트롤 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          {symbols.map((item) => (
            <button
              key={item.symbol}
              onClick={() => setSelectedSymbol(item.symbol)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedSymbol === item.symbol
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          {intervals.map((item) => (
            <button
              key={item.key}
              onClick={() => setInterval(item.key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                interval === item.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 실시간 차트 */}
      <RealTimeChart 
        symbol={selectedSymbol}
        interval={interval}
        height={300}
      />
    </div>
  )
}

export default QuickChart
