'use client'

import { GetPortfolioResponse } from '@/lib/types/market'

interface PortfolioOverviewProps {
  portfolio?: GetPortfolioResponse
}

const PortfolioOverview = ({ portfolio }: PortfolioOverviewProps) => {
  if (!portfolio) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }

  const getColorClass = (value: number) => {
    if (value === 0) return 'text-gray-500'
    return value > 0 ? 'text-green-600' : 'text-red-600'
  }

  const metrics = [
    {
      label: '총 투자금액',
      value: formatCurrency(portfolio.holdings.reduce((sum, h) => sum + h.total_invested, 0)),
      icon: '💰',
      color: 'text-gray-800'
    },
    {
      label: '현재 평가금액',
      value: formatCurrency(portfolio.total_value),
      icon: '📊',
      color: 'text-gray-800'
    },
    {
      label: '평가손익',
      value: formatCurrency(portfolio.total_profit_loss),
      icon: portfolio.total_profit_loss >= 0 ? '📈' : '📉',
      color: getColorClass(portfolio.total_profit_loss)
    },
    {
      label: '수익률',
      value: formatPercent(portfolio.total_profit_loss_percent),
      icon: portfolio.total_profit_loss_percent >= 0 ? '⬆️' : '⬇️',
      color: getColorClass(portfolio.total_profit_loss_percent)
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          💼 포트폴리오 개요
        </h2>
        <div className="text-sm text-gray-500">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{metric.icon}</span>
              <span className="text-sm text-gray-600 font-medium">
                {metric.label}
              </span>
            </div>
            
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* 추가 통계 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500 mb-1">보유 종목 수</div>
            <div className="font-semibold text-gray-800">
              {portfolio.holdings.length}개
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-500 mb-1">최고 수익률</div>
            <div className={`font-semibold ${
              portfolio.holdings.length > 0 
                ? getColorClass(Math.max(...portfolio.holdings.map(h => h.profit_loss_percent || 0)))
                : 'text-gray-500'
            }`}>
              {portfolio.holdings.length > 0 
                ? formatPercent(Math.max(...portfolio.holdings.map(h => h.profit_loss_percent || 0)))
                : '-'
              }
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-500 mb-1">최저 수익률</div>
            <div className={`font-semibold ${
              portfolio.holdings.length > 0 
                ? getColorClass(Math.min(...portfolio.holdings.map(h => h.profit_loss_percent || 0)))
                : 'text-gray-500'
            }`}>
              {portfolio.holdings.length > 0 
                ? formatPercent(Math.min(...portfolio.holdings.map(h => h.profit_loss_percent || 0)))
                : '-'
              }
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-500 mb-1">승률</div>
            <div className="font-semibold text-gray-800">
              {portfolio.holdings.length > 0 
                ? `${((portfolio.holdings.filter(h => (h.profit_loss || 0) > 0).length / portfolio.holdings.length) * 100).toFixed(1)}%`
                : '-'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioOverview
