'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QuizChoice } from '@/lib/types'

interface ChoiceButtonsProps {
  disabled: boolean
  onChoice: (choice: QuizChoice) => void
  className?: string
}

const ChoiceButtons = ({ disabled, onChoice, className = '' }: ChoiceButtonsProps) => {
  const [selectedChoice, setSelectedChoice] = useState<QuizChoice | null>(null)
  const { t } = useTranslation()

  const handleChoice = (choice: QuizChoice) => {
    if (disabled || selectedChoice) return
    
    setSelectedChoice(choice)
    onChoice(choice)
  }

  const getButtonClass = (choice: QuizChoice) => {
    const baseClass = `
      flex-1 py-4 px-6 text-xl font-bold rounded-lg transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-opacity-50
      disabled:opacity-50 disabled:cursor-not-allowed
    `
    
    if (selectedChoice === choice) {
      switch (choice) {
        case 'UP':
          return `${baseClass} bg-success text-white shadow-lg scale-105`
        case 'DOWN':
          return `${baseClass} bg-danger text-white shadow-lg scale-105`
        case 'FLAT':
          return `${baseClass} bg-warning text-white shadow-lg scale-105`
      }
    }

    if (disabled) {
      return `${baseClass} bg-gray-200 text-gray-500 cursor-not-allowed`
    }

    switch (choice) {
      case 'UP':
        return `${baseClass} bg-success hover:bg-green-600 text-white shadow-md hover:shadow-lg hover:scale-105 focus:ring-green-300`
      case 'DOWN':
        return `${baseClass} bg-danger hover:bg-red-600 text-white shadow-md hover:shadow-lg hover:scale-105 focus:ring-red-300`
      case 'FLAT':
        return `${baseClass} bg-warning hover:bg-yellow-600 text-white shadow-md hover:shadow-lg hover:scale-105 focus:ring-yellow-300`
    }
  }

  const choices: { key: QuizChoice; label: string; icon: string }[] = [
    { key: 'UP', label: t('up'), icon: '📈' },
    { key: 'DOWN', label: t('down'), icon: '📉' },
    { key: 'FLAT', label: t('flat'), icon: '➡️' },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t('choose_direction')}
        </h2>
        <p className="text-gray-600">
          {disabled ? t('countdown') : 'Make your prediction!'}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {choices.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            disabled={disabled || selectedChoice !== null}
            onClick={() => handleChoice(key)}
            className={getButtonClass(key)}
            aria-label={`Choose ${label}`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl" role="img" aria-label={`${label} icon`}>
                {icon}
              </span>
              <span>{label}</span>
            </div>
          </button>
        ))}
      </div>

      {selectedChoice && (
        <div className="text-center mt-4">
          <p className="text-lg font-medium text-gray-700">
            You chose: <span className="font-bold">{t(selectedChoice.toLowerCase())}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default ChoiceButtons
