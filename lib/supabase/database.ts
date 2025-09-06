import { createClient, isSupabaseConfigured } from './client'
import { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type QuizBank = Tables['quiz_bank']['Row']
type QuizAttempt = Tables['quiz_attempt']['Row']
type AppUser = Tables['app_user']['Row']

// 클라이언트 사이드 데이터베이스 헬퍼
export const databaseHelpers = {
  // 퀴즈 관련
  async getRandomQuiz(difficulty?: number): Promise<QuizBank | null> {
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const supabase = createClient()
      let query = supabase
        .from('quiz_bank')
        .select('*')

      if (difficulty) {
        query = query.eq('difficulty', difficulty)
      }

      const { data, error } = await query
        .order('id', { ascending: false })
        .limit(50)

      if (error || !data?.length) {
        return null
      }

      // 랜덤하게 하나 선택
      const randomIndex = Math.floor(Math.random() * data.length)
      return data[randomIndex]
    } catch (error) {
      console.error('Error getting random quiz:', error)
      return null
    }
  },

  // 퀴즈 시도 기록
  async recordQuizAttempt(attempt: {
    quiz_id: number
    choice: 'UP' | 'DOWN' | 'FLAT'
    is_correct: boolean
    score: number
    took_ms: number
  }): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('quiz_attempt')
        .insert({
          ...attempt,
          user_id: user?.id || null
        })

      return !error
    } catch (error) {
      console.error('Error recording quiz attempt:', error)
      return false
    }
  },

  // 리더보드 가져오기
  async getLeaderboard(limit = 10) {
    if (!isSupabaseConfigured()) {
      return []
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .limit(limit)

      return error ? [] : data || []
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return []
    }
  },

  // 사용자 생성/업데이트
  async upsertUser(userData: { handle?: string }): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { error } = await supabase
        .from('app_user')
        .upsert({
          id: user.id,
          handle: userData.handle,
        })

      return !error
    } catch (error) {
      console.error('Error upserting user:', error)
      return false
    }
  },

  // 사용자 통계 가져오기
  async getUserStats(userId?: string) {
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const supabase = createClient()
      let targetUserId = userId

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        targetUserId = user?.id
      }

      if (!targetUserId) return null

      const { data, error } = await supabase
        .from('quiz_attempt')
        .select('*')
        .eq('user_id', targetUserId)

      if (error || !data) return null

      const totalAttempts = data.length
      const correctAttempts = data.filter(a => a.is_correct).length
      const totalScore = data.reduce((sum, a) => sum + (a.score || 0), 0)
      const averageTime = data.length > 0 
        ? data.reduce((sum, a) => sum + (a.took_ms || 0), 0) / data.length 
        : 0

      return {
        totalAttempts,
        correctAttempts,
        accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
        totalScore,
        averageTime
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return null
    }
  }
}

