'use client'

import { useState } from 'react'
import { useAuth } from './providers'
import AuthModal from '@/components/AuthModal'
import FuturesGame from '@/components/FuturesGameReal'

export default function HomePage() {
  const { user, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Always show the trading game directly (like AlphaSquare)
  return (
    <>
      <FuturesGame showAuthModal={!user} onShowAuth={() => setShowAuthModal(true)} />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}