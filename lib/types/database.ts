export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_user: {
        Row: {
          id: string
          handle: string | null
          created_at: string
        }
        Insert: {
          id?: string
          handle?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          handle?: string | null
          created_at?: string
        }
      }
      quiz_bank: {
        Row: {
          id: number
          symbol: string
          timeframe: string
          start_ts: string
          preview_candles: Json
          answer_candles: Json
          answer: 'UP' | 'DOWN' | 'FLAT'
          difficulty: number
          created_at: string
        }
        Insert: {
          id?: number
          symbol: string
          timeframe: string
          start_ts: string
          preview_candles: Json
          answer_candles: Json
          answer: 'UP' | 'DOWN' | 'FLAT'
          difficulty?: number
          created_at?: string
        }
        Update: {
          id?: number
          symbol?: string
          timeframe?: string
          start_ts?: string
          preview_candles?: Json
          answer_candles?: Json
          answer?: 'UP' | 'DOWN' | 'FLAT'
          difficulty?: number
          created_at?: string
        }
      }
      quiz_attempt: {
        Row: {
          id: number
          user_id: string | null
          quiz_id: number
          choice: 'UP' | 'DOWN' | 'FLAT'
          is_correct: boolean | null
          score: number | null
          took_ms: number | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          quiz_id: number
          choice: 'UP' | 'DOWN' | 'FLAT'
          is_correct?: boolean | null
          score?: number | null
          took_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          quiz_id?: number
          choice?: 'UP' | 'DOWN' | 'FLAT'
          is_correct?: boolean | null
          score?: number | null
          took_ms?: number | null
          created_at?: string
        }
      }
      ratelimit_hits: {
        Row: {
          id: number
          ip: string
          key: string
          ts: string
        }
        Insert: {
          id?: number
          ip: string
          key: string
          ts?: string
        }
        Update: {
          id?: number
          ip?: string
          key?: string
          ts?: string
        }
      }
    }
    Views: {
      weekly_leaderboard: {
        Row: {
          rank: number
          handle_or_anon: string
          score_sum: number
          correct_rate: number
          attempts: number
          user_id: string
        }
      }
    }
  }
}
