'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CountdownProps {
  duration: number // seconds
  onComplete: () => void
  className?: string
}

const Countdown = ({ duration, onComplete, className = '' }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isActive, setIsActive] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    setTimeLeft(duration)
    setIsActive(true)
  }, [duration])

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft <= 0) {
        onComplete()
      }
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, timeLeft, onComplete])

  const getColorClass = () => {
    if (timeLeft <= 1) return 'text-red-500'
    if (timeLeft <= 2) return 'text-orange-500'
    return 'text-primary-600'
  }

  const getScaleClass = () => {
    return timeLeft <= 2 ? 'scale-110' : 'scale-100'
  }

  return (
    <div className={`text-center ${className}`} role="timer" aria-live="polite">
      <div className="mb-2">
        <span className="text-sm font-medium text-gray-600">
          {t('countdown')}
        </span>
      </div>
      <div 
        className={`
          text-6xl font-mono font-bold transition-all duration-300 
          ${getColorClass()} ${getScaleClass()}
        `}
        aria-label={`${timeLeft} seconds remaining`}
      >
        {timeLeft}
      </div>
      {timeLeft <= 0 && (
        <div className="mt-2 text-lg font-semibold text-gray-800 animate-pulse">
          {t('choose_direction')}
        </div>
      )}
    </div>
  )
}

export default Countdown
