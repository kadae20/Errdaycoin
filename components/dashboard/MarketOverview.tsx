'use client'

interface MarketOverviewProps {
  data?: {
    totalMarketCap: number
    totalVolume24h: number
    btcDominance: number
    activeAssets: number
  }
}

const MarketOverview = ({ data }: MarketOverviewProps) => {
  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  const formatNumber = (num: number, compact = true) => {
    if (compact && num >= 1e12) {
      return `${(num / 1e12).toFixed(1)}T`
    }
    if (compact && num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`
    }
    if (compact && num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`
    }
    return num.toLocaleString()
  }

  const metrics = [
    {
      label: '총 시가총액',
      value: `$${formatNumber(data.totalMarketCap)}`,
      change: '+2.5%',
      positive: true,
      icon: '💰'
    },
    {
      label: '24시간 거래량',
      value: `$${formatNumber(data.totalVolume24h)}`,
      change: '+12.8%',
      positive: true,
      icon: '📊'
    },
    {
      label: 'BTC 도미넌스',
      value: `${data.btcDominance.toFixed(1)}%`,
      change: '-0.3%',
      positive: false,
      icon: '₿'
    },
    {
      label: '활성 자산',
      value: formatNumber(data.activeAssets, false),
      change: '+5',
      positive: true,
      icon: '🎯'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{metric.icon}</span>
            <span className="text-sm text-gray-600 font-medium">
              {metric.label}
            </span>
          </div>
          
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {metric.value}
          </div>
          
          <div className={`text-sm font-medium ${
            metric.positive ? 'text-green-600' : 'text-red-600'
          }`}>
            {metric.change}
          </div>
        </div>
      ))}
    </div>
  )
}

export default MarketOverview
