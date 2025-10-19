'use client'


interface ScoreBadgeProps {
  score: number
  isCorrect: boolean
  className?: string
  showAnimation?: boolean
}

const ScoreBadge = ({ 
  score, 
  isCorrect, 
  className = '', 
  showAnimation = true 
}: ScoreBadgeProps) => {

  const badgeClass = isCorrect 
    ? 'bg-success text-white border-green-600' 
    : 'bg-danger text-white border-red-600'

  const animationClass = showAnimation 
    ? 'animate-bounce' 
    : ''

  return (
    <div className={`text-center ${className}`}>
      <div 
        className={`
          inline-flex items-center gap-3 px-6 py-4 rounded-full border-2 
          ${badgeClass} ${animationClass} shadow-lg
        `}
        role="status"
        aria-live="polite"
      >
        <span className="text-2xl" role="img" aria-label={isCorrect ? "Correct" : "Wrong"}>
          {isCorrect ? '✅' : '❌'}
        </span>
        <div className="text-left">
          <div className="text-lg font-bold">
            {isCorrect ? 'Correct' : 'Wrong'}
          </div>
          <div className="text-sm opacity-90">
            {score} points
          </div>
        </div>
      </div>
      
      {score > 150 && (
        <div className="mt-2 text-sm font-medium text-yellow-600">
          🔥 Bonus points for speed!
        </div>
      )}
    </div>
  )
}

export default ScoreBadge
