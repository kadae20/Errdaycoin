'use client'

const TechnicalIndicators = () => {
  // 샘플 지표 데이터
  const indicators = [
    {
      name: 'RSI (14)',
      value: 68.5,
      signal: 'NEUTRAL',
      description: '중립 구간',
    },
    {
      name: 'MACD',
      value: 0.25,
      signal: 'BUY',
      description: '상승 신호',
    },
    {
      name: 'Stochastic',
      value: 75.2,
      signal: 'SELL',
      description: '과매수',
    },
    {
      name: 'Williams %R',
      value: -28.4,
      signal: 'BUY',
      description: '매수 신호',
    },
    {
      name: 'CCI (20)',
      value: 125.6,
      signal: 'SELL',
      description: '과매수',
    },
    {
      name: 'ADX (14)',
      value: 45.3,
      signal: 'BUY',
      description: '강한 추세',
    },
  ]

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'text-green-600'
      case 'SELL':
        return 'text-red-600'
      case 'NEUTRAL':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return '📈'
      case 'SELL':
        return '📉'
      case 'NEUTRAL':
        return '⏸️'
      default:
        return '❓'
    }
  }

  // 전체 신호 요약
  const buySignals = indicators.filter(i => i.signal === 'BUY').length
  const sellSignals = indicators.filter(i => i.signal === 'SELL').length
  const neutralSignals = indicators.filter(i => i.signal === 'NEUTRAL').length

  const getOverallSignal = () => {
    if (buySignals > sellSignals) return { signal: 'BUY', color: 'text-green-600', icon: '📈' }
    if (sellSignals > buySignals) return { signal: 'SELL', color: 'text-red-600', icon: '📉' }
    return { signal: 'NEUTRAL', color: 'text-yellow-600', icon: '⏸️' }
  }

  const overall = getOverallSignal()

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📊 기술적 지표
      </h3>

      {/* 전체 신호 요약 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">전체 신호</span>
          <span className={`font-semibold ${overall.color}`}>
            {overall.icon} {overall.signal}
          </span>
        </div>
        
        <div className="flex gap-4 text-sm">
          <div className="text-green-600">
            매수: {buySignals}개
          </div>
          <div className="text-red-600">
            매도: {sellSignals}개
          </div>
          <div className="text-yellow-600">
            중립: {neutralSignals}개
          </div>
        </div>
      </div>

      {/* 개별 지표 */}
      <div className="space-y-3">
        {indicators.map((indicator, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex-1">
              <div className="font-medium text-gray-800 text-sm">
                {indicator.name}
              </div>
              <div className="text-xs text-gray-500">
                {indicator.description}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">
                {indicator.value.toFixed(1)}
              </div>
              <div className={`text-xs font-medium ${getSignalColor(indicator.signal)}`}>
                {getSignalIcon(indicator.signal)} {indicator.signal}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 업데이트 시간 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </div>
      </div>

      {/* 지표 설명 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          📚 지표 가이드
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>RSI:</strong> 70 이상 과매수, 30 이하 과매도</li>
          <li>• <strong>MACD:</strong> 신호선 교차로 매매 타이밍 판단</li>
          <li>• <strong>Stochastic:</strong> 80 이상 과매수, 20 이하 과매도</li>
          <li>• <strong>ADX:</strong> 25 이상이면 추세 강함</li>
        </ul>
      </div>
    </div>
  )
}

export default TechnicalIndicators
