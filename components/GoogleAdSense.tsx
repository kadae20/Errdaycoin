'use client'

import { useEffect } from 'react'

interface GoogleAdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  adStyle?: React.CSSProperties
  className?: string
}

export default function GoogleAdSense({ 
  adSlot, 
  adFormat = 'auto', 
  adStyle = { display: 'block' },
  className = ''
}: GoogleAdSenseProps) {
  useEffect(() => {
    try {
      // Google AdSense 스크립트 로드
      if (typeof window !== 'undefined' && !window.adsbygoogle) {
        const script = document.createElement('script')
        script.async = true
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2319980327991183'
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
      }

      // 광고 초기화
      if (window.adsbygoogle) {
        ;(window.adsbygoogle as any).push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  return (
    <div className={`ad-container ${className}`} style={adStyle}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-2319980327991183"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  )
}

// 사이드바용 세로 광고 컴포넌트
export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={`sidebar-ad ${className}`}>
      <GoogleAdSense
        adSlot="1234567890" // 실제 슬롯 ID로 교체 필요
        adFormat="vertical"
        adStyle={{ 
          display: 'block',
          width: '160px',
          height: '600px',
          margin: '0 auto'
        }}
      />
    </div>
  )
}

// 상단/하단용 가로 광고 컴포넌트
export function BannerAd({ className = '' }: { className?: string }) {
  return (
    <div className={`banner-ad ${className}`}>
      <GoogleAdSense
        adSlot="0987654321" // 실제 슬롯 ID로 교체 필요
        adFormat="horizontal"
        adStyle={{ 
          display: 'block',
          width: '100%',
          height: '90px',
          margin: '10px 0'
        }}
      />
    </div>
  )
}

// 반응형 광고 컴포넌트
export function ResponsiveAd({ className = '' }: { className?: string }) {
  return (
    <div className={`responsive-ad ${className}`}>
      <GoogleAdSense
        adSlot="1122334455" // 실제 슬롯 ID로 교체 필요
        adFormat="auto"
        adStyle={{ 
          display: 'block',
          width: '100%'
        }}
      />
    </div>
  )
}
