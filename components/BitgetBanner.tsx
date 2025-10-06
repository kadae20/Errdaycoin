'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { createClient } from '@/lib/supabase/client'

interface BitgetBannerProps {
  slot?: string
  className?: string
}

export default function BitgetBanner({ slot = 'top', className = '' }: BitgetBannerProps) {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const supabase = createClient()

  // Bitget 레퍼럴 코드 (실제 코드로 교체 필요)
  const BITGET_REF_CODE = process.env.NEXT_PUBLIC_BITGET_REF_CODE || 'hfna'
  const BITGET_SIGNUP_URL = `https://www.bitget.com/asia/expressly?languageType=3&channelCode=char&vipCode=${BITGET_REF_CODE}`

  // 배너 클릭 추적
  const trackBannerClick = async () => {
    try {
      // 고유 핑거프린트 생성 (간단한 버전)
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
      ].join('|')

      const clickData = {
        user_id: user?.id || null,
        exchange: 'bitget',
        ref_code: BITGET_REF_CODE,
        banner_slot: slot,
        utm_source: 'errdaycoin',
        utm_medium: 'banner',
        utm_campaign: 'futures_game',
        fingerprint: btoa(fingerprint) // Base64 인코딩
      }

      await supabase.from('clicks').insert(clickData)
    } catch (error) {
      console.error('Failed to track banner click:', error)
    }
  }

  const handleBannerClick = () => {
    trackBannerClick()
    window.open(BITGET_SIGNUP_URL, '_blank', 'noopener,noreferrer')
  }

  const closeBanner = () => {
    setIsVisible(false)
    // 세션 스토리지에 닫힘 상태 저장 (24시간)
    sessionStorage.setItem(`bitget_banner_${slot}_closed`, Date.now().toString())
  }

  // 배너 닫힘 상태 확인
  useEffect(() => {
    const closedTime = sessionStorage.getItem(`bitget_banner_${slot}_closed`)
    if (closedTime) {
      const timeDiff = Date.now() - parseInt(closedTime)
      // 24시간 (86400000ms) 후에 다시 표시
      if (timeDiff < 86400000) {
        setIsVisible(false)
      }
    }
  }, [slot])

  if (!isVisible) return null

  return (
    <div className={`relative bg-gradient-to-r from-yellow-400 to-orange-500 text-black ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="font-bold text-lg">🚀 Bitget</div>
            <div className="hidden md:block">
              <span className="font-semibold">Start Real Futures Trading!</span>
              <span className="ml-2 text-sm opacity-90">
                Up to 100x Leverage • Fee Discount Benefits
              </span>
            </div>
            <div className="md:hidden">
              <span className="font-semibold text-sm">Start Real Trading!</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBannerClick}
              className="bg-black text-yellow-400 hover:bg-gray-800 px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200"
            >
              Sign Up
            </button>
            
            <button
              onClick={closeBanner}
              className="text-black hover:text-gray-700 p-1 rounded"
              aria-label="Close banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 하단 작은 텍스트 */}
      <div className="bg-black bg-opacity-10 px-4 py-1">
        <div className="container mx-auto">
          <p className="text-xs text-center opacity-80">
            ⚠️ Futures trading involves high risk. Please review thoroughly before investing. 
            This is an affiliate link and signup may result in fee benefits and rewards.
            <span className="ml-2">Referral Code: <span className="font-mono font-bold">{BITGET_REF_CODE}</span></span>
          </p>
        </div>
      </div>
    </div>
  )
}

// 사이드바용 작은 배너
export function BitgetSidebarBanner() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const BITGET_REF_CODE = process.env.NEXT_PUBLIC_BITGET_REF_CODE || 'hfna'
  const BITGET_SIGNUP_URL = `https://www.bitget.com/asia/expressly?languageType=3&channelCode=char&vipCode=${BITGET_REF_CODE}`

  const trackClick = async () => {
    try {
      await supabase.from('clicks').insert({
        user_id: user?.id || null,
        exchange: 'bitget',
        ref_code: BITGET_REF_CODE,
        banner_slot: 'sidebar',
        utm_source: 'errdaycoin',
        utm_medium: 'sidebar_banner',
        utm_campaign: 'futures_game'
      })
    } catch (error) {
      console.error('Failed to track sidebar banner click:', error)
    }
  }

  const handleClick = () => {
    trackClick()
    window.open(BITGET_SIGNUP_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-4 text-black cursor-pointer hover:shadow-lg transition-shadow duration-200">
      <div onClick={handleClick}>
        <div className="font-bold text-lg mb-2">🚀 Bitget</div>
        <div className="text-sm mb-3">
          <div className="font-semibold">Real Futures Trading</div>
          <div className="opacity-90">Up to 100x Leverage</div>
        </div>
        <div className="bg-black text-yellow-400 text-center py-2 rounded font-semibold text-sm hover:bg-gray-800 transition-colors">
          Sign Up Now
        </div>
        <div className="text-xs text-center mt-2 opacity-80">
          Code: {BITGET_REF_CODE}
        </div>
      </div>
    </div>
  )
}

// 플로팅 배너 (모바일용)
export function BitgetFloatingBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()
  
  const BITGET_REF_CODE = process.env.NEXT_PUBLIC_BITGET_REF_CODE || 'hfna'
  const BITGET_SIGNUP_URL = `https://www.bitget.com/asia/expressly?languageType=3&channelCode=char&vipCode=${BITGET_REF_CODE}`

  const trackClick = async () => {
    try {
      await supabase.from('clicks').insert({
        user_id: user?.id || null,
        exchange: 'bitget',
        ref_code: BITGET_REF_CODE,
        banner_slot: 'floating',
        utm_source: 'errdaycoin',
        utm_medium: 'floating_banner',
        utm_campaign: 'futures_game'
      })
    } catch (error) {
      console.error('Failed to track floating banner click:', error)
    }
  }

  const handleClick = () => {
    trackClick()
    window.open(BITGET_SIGNUP_URL, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    const closed = sessionStorage.getItem('bitget_floating_closed')
    if (closed) {
      const timeDiff = Date.now() - parseInt(closed)
      if (timeDiff < 86400000) { // 24시간
        setIsVisible(false)
      }
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-3 text-black shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-bold text-sm">🚀 Real Trading</div>
            <div className="text-xs opacity-90">100x Leverage on Bitget</div>
          </div>
          <button
            onClick={handleClick}
            className="bg-black text-yellow-400 px-3 py-1 rounded text-sm font-semibold ml-2"
          >
            Sign Up
          </button>
          <button
            onClick={() => {
              setIsVisible(false)
              sessionStorage.setItem('bitget_floating_closed', Date.now().toString())
            }}
            className="ml-2 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
