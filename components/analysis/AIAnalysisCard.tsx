'use client'

import { AIAnalysis, Asset } from '@/lib/types/market'

interface AIAnalysisCardProps {
  analysis: AIAnalysis & { asset: Asset }
  onAssetClick: (asset: Asset) => void
}

const AIAnalysisCard = ({ analysis, onAssetClick }: AIAnalysisCardProps) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SELL':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HOLD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return '📈'
      case 'SELL':
        return '📉'
      case 'HOLD':
        return '⏸️'
      default:
        return '❓'
    }
  }

  const getSignalLabel = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return '매수'
      case 'SELL':
        return '매도'
      case 'HOLD':
        return '보유'
      default:
        return signal
    }
  }

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'TECHNICAL':
        return '📊'
      case 'SENTIMENT':
        return '💭'
      case 'PATTERN':
        return '🔍'
      default:
        return '🤖'
    }
  }

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'TECHNICAL':
        return '기술적 분석'
      case 'SENTIMENT':
        return '감정 분석'
      case 'PATTERN':
        return '패턴 분석'
      default:
        return type
    }
  }

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAssetIcon = (symbol: string, logoUrl?: string | null) => {
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt={symbol}
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }
    
    const iconMap: Record<string, string> = {
      'BTC-USD': '₿',
      'ETH-USD': 'Ξ',
      'AAPL': '🍎',
      'MSFT': '🪟',
      'GOOGL': '🔍',
      'AMZN': '📦',
      'TSLA': '🚗',
      'NVDA': '🎮',
      'META': '📘',
    }
    
    return (
      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-lg">
        {iconMap[symbol] || symbol.charAt(0)}
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onAssetClick(analysis.asset)}
          className="flex items-center gap-3 hover:text-primary-600 transition-colors"
        >
          <div className="relative">
            {getAssetIcon(analysis.asset.symbol, analysis.asset.logo_url)}
            <div className="hidden w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs">
              {analysis.asset.symbol.charAt(0)}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {analysis.asset.symbol}
            </div>
            <div className="text-sm text-gray-500">
              {analysis.asset.name_ko || analysis.asset.name}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {/* 분석 유형 */}
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {getAnalysisTypeIcon(analysis.analysis_type)}
            {getAnalysisTypeLabel(analysis.analysis_type)}
          </span>

          {/* 신호 */}
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${
            getSignalColor(analysis.signal)
          }`}>
            {getSignalIcon(analysis.signal)}
            {getSignalLabel(analysis.signal)}
          </span>
        </div>
      </div>

      {/* 분석 내용 */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">
          {analysis.reasoning || '상세한 분석 내용이 제공되지 않았습니다.'}
        </p>
      </div>

      {/* 기술적 지표 (있는 경우) */}
      {analysis.indicators && Object.keys(analysis.indicators).length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">📊 주요 지표</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(analysis.indicators).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className="font-medium text-gray-800">
                  {typeof value === 'number' ? value.toFixed(2) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 푸터 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>🤖</span>
            <span>AI 분석</span>
          </div>
          
          {analysis.confidence && (
            <div className="flex items-center gap-1">
              <span>🎯</span>
              <span className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                신뢰도 {analysis.confidence.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
        
        <div className="text-xs">
          {formatTimeAgo(analysis.created_at)}
        </div>
      </div>
    </div>
  )
}

export default AIAnalysisCard
