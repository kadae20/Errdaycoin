import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { createDirectClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createDirectClient()
    const attemptId = params.id

    // Fetch attempt data
    const { data: attempt, error } = await supabase
      .from('quiz_attempt')
      .select(`
        id,
        choice,
        is_correct,
        score,
        created_at,
        quiz_bank (
          symbol,
          answer
        )
      `)
      .eq('id', attemptId)
      .single()

    if (error || !attempt) {
      return new Response('Attempt not found', { status: 404 })
    }

        // Calculate percentile (simplified - in real app you'd calculate this properly)
    const percentile = (attempt as any).is_correct
      ? Math.min(95, Math.max(60, 75 + ((attempt as any).score - 100) / 10))
      : Math.min(40, Math.max(5, 25 - (100 - (attempt as any).score) / 10))

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            backgroundImage: 'linear-gradient(45deg, #f0f9ff 25%, transparent 25%), linear-gradient(-45deg, #f0f9ff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f9ff 75%), linear-gradient(-45deg, transparent 75%, #f0f9ff 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ fontSize: '48px', marginRight: '16px' }}>📈</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>
              BuyOrSell Quiz
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'white',
              padding: '60px',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '2px solid #e5e7eb',
            }}
          >
            {/* Result Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: (attempt as any).is_correct ? '#10b981' : '#ef4444',
                color: 'white',
                padding: '20px 40px',
                borderRadius: '50px',
                marginBottom: '30px',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              <div style={{ marginRight: '12px', fontSize: '32px' }}>
                {(attempt as any).is_correct ? '✅' : '❌'}
              </div>
              <div>
                {(attempt as any).is_correct ? 'Correct!' : 'Wrong'}
              </div>
            </div>

            {/* Score */}
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#3b82f6',
                marginBottom: '20px',
              }}
            >
              {(attempt as any).score}
            </div>
            <div
              style={{
                fontSize: '24px',
                color: '#6b7280',
                marginBottom: '30px',
              }}
            >
              Points
            </div>

            {/* Details */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                fontSize: '18px',
                color: '#4b5563',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                  {(attempt as any).quiz_bank.symbol}
                </div>
                <div>Symbol</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                  {(attempt as any).choice}
                </div>
                <div>Your Choice</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                  {percentile.toFixed(0)}%
                </div>
                <div>Percentile</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '40px',
              fontSize: '16px',
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            Educational trading game • Not financial advice
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
