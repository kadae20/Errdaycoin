import { Suspense } from 'react'
import HomePageClient from './HomePageClient'

// SSR 본문 - 초기 HTML에 바로 보이도록
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1300] via-[#7a3e00] to-[#c25a00]">
      {/* SSR 본문 - 검색엔진 최적화 (숨김 처리) */}
      <div className="sr-only">
        <h1>Free Crypto Futures Trading Simulator</h1>
        <p>Go long/short up to 100x, learn with next-day PnL & liquidation.</p>
      </div>
      
      <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#1f1300] via-[#7a3e00] to-[#c25a00]" />}>
        <HomePageClient />
      </Suspense>
    </div>
  )
}