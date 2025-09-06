import { createServerClient, createServiceClient } from './server'
import { isSupabaseConfigured } from './client'
import { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type QuizBank = Tables['quiz_bank']['Row']

// 서버 사이드 데이터베이스 헬퍼
export const serverDatabaseHelpers = {
  // 서버에서 퀴즈 가져오기
  async getQuizById(id: number): Promise<QuizBank | null> {
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from('quiz_bank')
        .select('*')
        .eq('id', id)
        .single()

      return error ? null : data
    } catch (error) {
      console.error('Error getting quiz by id:', error)
      return null
    }
  },

  // 관리자용 - 퀴즈 추가 (Service Role 필요)
  async addQuiz(quiz: Omit<QuizBank, 'id' | 'created_at'>): Promise<boolean> {
    const supabase = createServiceClient()
    if (!supabase) return false

    try {
      const { error } = await (supabase as any)
        .from('quiz_bank')
        .insert(quiz)

      return !error
    } catch (error) {
      console.error('Error adding quiz:', error)
      return false
    }
  }
}

