import { render, screen } from '@testing-library/react'
import ScoreBadge from '../ScoreBadge'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        correct: 'Correct!',
        wrong: 'Wrong',
        points: 'Points',
      }
      return translations[key] || key
    },
  }),
}))

describe('ScoreBadge', () => {
  it('renders correct badge with green styling', () => {
    render(<ScoreBadge score={150} isCorrect={true} />)
    
    expect(screen.getByText('Correct!')).toBeInTheDocument()
    expect(screen.getByText('150 Points')).toBeInTheDocument()
    expect(screen.getByLabelText('Correct')).toBeInTheDocument()
  })

  it('renders incorrect badge with red styling', () => {
    render(<ScoreBadge score={0} isCorrect={false} />)
    
    expect(screen.getByText('Wrong')).toBeInTheDocument()
    expect(screen.getByText('0 Points')).toBeInTheDocument()
    expect(screen.getByLabelText('Wrong')).toBeInTheDocument()
  })

  it('shows bonus message for high scores', () => {
    render(<ScoreBadge score={175} isCorrect={true} />)
    
    expect(screen.getByText('🔥 Bonus points for speed!')).toBeInTheDocument()
  })

  it('does not show bonus message for normal scores', () => {
    render(<ScoreBadge score={120} isCorrect={true} />)
    
    expect(screen.queryByText('🔥 Bonus points for speed!')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ScoreBadge score={100} isCorrect={true} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('can disable animation', () => {
    const { container } = render(
      <ScoreBadge score={100} isCorrect={true} showAnimation={false} />
    )
    
    // Should not have animate-bounce class
    const badge = container.querySelector('[role="status"]')
    expect(badge).not.toHaveClass('animate-bounce')
  })

  it('has proper accessibility attributes', () => {
    render(<ScoreBadge score={100} isCorrect={true} />)
    
    const statusElement = screen.getByRole('status')
    expect(statusElement).toHaveAttribute('aria-live', 'polite')
  })

  it('handles zero score correctly', () => {
    render(<ScoreBadge score={0} isCorrect={false} />)
    
    expect(screen.getByText('0 Points')).toBeInTheDocument()
    expect(screen.queryByText('🔥 Bonus points for speed!')).not.toBeInTheDocument()
  })

  it('formats large scores correctly', () => {
    render(<ScoreBadge score={9999} isCorrect={true} />)
    
    expect(screen.getByText('9999 Points')).toBeInTheDocument()
  })
})
