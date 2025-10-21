import { Suspense } from 'react'
import HomePageClient from './HomePageClient'

// SSR 본문 - 초기 HTML에 바로 보이도록
export default function HomePage() {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#1f1300] via-[#7a3e00] to-[#c25a00]">
      {/* SSR 본문 - 검색엔진 최적화 (완전히 숨김) */}
      <div className="sr-only" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
        <h1>Free Crypto Futures Trading Simulator - Practice Bitcoin and Ethereum Trading</h1>
        <p>Learn leverage trading with real charts. Go long/short up to 100x, experience next-day PnL and liquidation scenarios.</p>
      </div>
      
      <Suspense fallback={<div className="min-h-screen w-screen bg-gradient-to-br from-[#1f1300] via-[#7a3e00] to-[#c25a00]" />}>
        <HomePageClient />
      </Suspense>
    </div>
  )
}