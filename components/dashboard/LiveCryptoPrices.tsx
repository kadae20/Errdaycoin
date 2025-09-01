'use client'

import { useState, useEffect } from 'react'
import { binanceAPI } from '@/lib/services/binance-api'
import Link from 'next/link'

interface CryptoPrice {
  symbol: string
  price: number
  change: number
  displayName: string
}

const LiveCryptoPrices = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cryptoSymbols = [
    'BTCUSDT',
    'ETHUSDT', 
    'BNBUSDT',
    'ADAUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'DOGEUSDT',
    'AVAXUSDT'
  ]

  useEffect(() => {
    let ws: WebSocket | null = null

    const initializePrices = async () => {
      try {
        // 초기 가격 데이터 로드
        const initialPrices = await Promise.all(
          cryptoSymbols.map(async (symbol) => {
            try {
              const tickerData = await binanceAPI.getTicker24hr(symbol)
              return {
                symbol,
                price: tickerData[0].price,
                change: tickerData[0].changePercent,
                displayName: binanceAPI.getDisplayName(symbol),
              }
            } catch (error) {
              console.error(`Failed to fetch ${symbol}:`, error)
              return {
                symbol,
                price: 0,
                change: 0,
                displayName: binanceAPI.getDisplayName(symbol),
              }
            }
          })
        )

        setPrices(initialPrices)
        setError(null)

        // WebSocket 실시간 연결
        ws = binanceAPI.createMultiTickerStream(
          cryptoSymbols,
          (data) => {
            setPrices(prevPrices => 
              prevPrices.map(price => 
                price.symbol === data.symbol
                  ? { ...price, price: data.price, change: data.change }
                  : price
              )
            )
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

      } catch (error) {
        console.error('Failed to initialize crypto prices:', error)
        setError('가격 데이터를 불러올 수 없습니다')
      }
    }

    initializePrices()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const formatPrice = (price: number) => {
    if (price === 0) return '$0.00'
    
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  const formatChange = (change: number) => {
    if (change === 0) return '0.00%'
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  const getChangeColor = (change: number) => {
    if (change === 0) return 'text-gray-500'
    return change > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getCryptoIcon = (symbol: string) => {
    const iconMap: Record<string, string> = {
      'BTCUSDT': '₿',
      'ETHUSDT': 'Ξ',
      'BNBUSDT': '🟡',
      'ADAUSDT': '🔷',
      'SOLUSDT': '🟣',
      'XRPUSDT': '💧',
      'DOGEUSDT': '🐕',
      'AVAXUSDT': '🔺',
    }
    return iconMap[symbol] || '🪙'
  }

  if (error && prices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">😵</div>
          <h3 className="font-semibold text-gray-800 mb-2">연결 실패</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            💰 실시간 암호화폐 시세
          </h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            {isConnected ? 'LIVE' : '연결 끊김'}
          </div>
        </div>
      </div>

      {/* 가격 목록 */}
      <div className="divide-y divide-gray-100">
        {prices.map((crypto) => (
          <Link
            key={crypto.symbol}
            href={`/asset/${crypto.symbol}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {getCryptoIcon(crypto.symbol)}
              </div>
              <div>
                <div className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                  {crypto.displayName}
                </div>
                <div className="text-sm text-gray-500">
                  {crypto.symbol.replace('USDT', '')}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-gray-800">
                {formatPrice(crypto.price)}
              </div>
              <div className={`text-sm font-medium ${getChangeColor(crypto.change)}`}>
                {formatChange(crypto.change)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 푸터 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            📊 바이낸스 실시간 데이터
          </div>
          <div>
            업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveCryptoPrices
