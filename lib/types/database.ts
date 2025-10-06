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
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          locale: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          locale?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          locale?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_tokens: {
        Row: {
          user_id: string
          retry_tokens: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          retry_tokens?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          retry_tokens?: number
          created_at?: string
          updated_at?: string
        }
      }
      token_logs: {
        Row: {
          id: number
          user_id: string | null
          delta: number
          kind: 'earn' | 'spend'
          reason: string | null
          meta: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          delta: number
          kind: 'earn' | 'spend'
          reason?: string | null
          meta?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          delta?: number
          kind?: 'earn' | 'spend'
          reason?: string | null
          meta?: Json | null
          created_at?: string
        }
      }
      referral_codes: {
        Row: {
          user_id: string
          code: string
          created_at: string
        }
        Insert: {
          user_id: string
          code: string
          created_at?: string
        }
        Update: {
          user_id?: string
          code?: string
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: number
          referrer_id: string | null
          referee_id: string
          code: string | null
          created_at: string
        }
        Insert: {
          id?: number
          referrer_id?: string | null
          referee_id: string
          code?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          referrer_id?: string | null
          referee_id?: string
          code?: string | null
          created_at?: string
        }
      }
      clicks: {
        Row: {
          click_id: string
          user_id: string | null
          exchange: string | null
          ref_code: string | null
          banner_slot: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          fingerprint: string | null
          created_at: string
        }
        Insert: {
          click_id?: string
          user_id?: string | null
          exchange?: string | null
          ref_code?: string | null
          banner_slot?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          fingerprint?: string | null
          created_at?: string
        }
        Update: {
          click_id?: string
          user_id?: string | null
          exchange?: string | null
          ref_code?: string | null
          banner_slot?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          fingerprint?: string | null
          created_at?: string
        }
      }
      referral_rewards: {
        Row: {
          id: number
          referee_id: string | null
          month: string
          reward_type: string | null
          amount: number | null
          rewarded: boolean
          created_at: string
        }
        Insert: {
          id?: number
          referee_id?: string | null
          month: string
          reward_type?: string | null
          amount?: number | null
          rewarded?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          referee_id?: string | null
          month?: string
          reward_type?: string | null
          amount?: number | null
          rewarded?: boolean
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: number
          user_id: string | null
          symbol: string | null
          entry_price: number | null
          leverage: number | null
          position_size: number | null
          side: 'long' | 'short' | null
          liquidation_price: number | null
          exit_price: number | null
          pnl: number | null
          roi: number | null
          nextday_uses_consumed: number
          is_liquidated: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          symbol?: string | null
          entry_price?: number | null
          leverage?: number | null
          position_size?: number | null
          side?: 'long' | 'short' | null
          liquidation_price?: number | null
          exit_price?: number | null
          pnl?: number | null
          roi?: number | null
          nextday_uses_consumed?: number
          is_liquidated?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          symbol?: string | null
          entry_price?: number | null
          leverage?: number | null
          position_size?: number | null
          side?: 'long' | 'short' | null
          liquidation_price?: number | null
          exit_price?: number | null
          pnl?: number | null
          roi?: number | null
          nextday_uses_consumed?: number
          is_liquidated?: boolean
          created_at?: string
          completed_at?: string | null
        }
      }
      market_category: {
        Row: {
          id: number
          code: string
          name_ko: string
          name_en: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name_ko: string
          name_en: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name_ko?: string
          name_en?: string
          is_active?: boolean
          created_at?: string
        }
      }
      asset: {
        Row: {
          id: number
          symbol: string
          name: string
          name_ko: string | null
          market_category_id: number
          asset_type: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX'
          exchange: string | null
          currency: string
          logo_url: string | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          symbol: string
          name: string
          name_ko?: string | null
          market_category_id: number
          asset_type: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX'
          exchange?: string | null
          currency?: string
          logo_url?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          symbol?: string
          name?: string
          name_ko?: string | null
          market_category_id?: number
          asset_type?: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX'
          exchange?: string | null
          currency?: string
          logo_url?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      asset_price: {
        Row: {
          id: number
          asset_id: number
          price: number
          change_amount: number
          change_percent: number
          volume: number
          market_cap: number | null
          high_24h: number
          low_24h: number
          timestamp: string
          source: string
        }
        Insert: {
          id?: number
          asset_id: number
          price: number
          change_amount: number
          change_percent: number
          volume: number
          market_cap?: number | null
          high_24h: number
          low_24h: number
          timestamp?: string
          source: string
        }
        Update: {
          id?: number
          asset_id?: number
          price?: number
          change_amount?: number
          change_percent?: number
          volume?: number
          market_cap?: number | null
          high_24h?: number
          low_24h?: number
          timestamp?: string
          source?: string
        }
      }
      user_portfolio: {
        Row: {
          id: number
          user_id: string
          name: string
          description: string | null
          initial_balance: number
          total_value: number
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          description?: string | null
          initial_balance?: number
          total_value?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          description?: string | null
          initial_balance?: number
          total_value?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_holding: {
        Row: {
          id: number
          portfolio_id: number
          asset_id: number
          quantity: number
          avg_buy_price: number
          total_invested: number
          last_updated: string
        }
        Insert: {
          id?: number
          portfolio_id: number
          asset_id: number
          quantity: number
          avg_buy_price: number
          total_invested: number
          last_updated?: string
        }
        Update: {
          id?: number
          portfolio_id?: number
          asset_id?: number
          quantity?: number
          avg_buy_price?: number
          total_invested?: number
          last_updated?: string
        }
      }
      transaction_history: {
        Row: {
          id: number
          user_id: string
          portfolio_id: number
          asset_id: number
          transaction_type: 'BUY' | 'SELL'
          quantity: number
          price: number
          total_amount: number
          fee: number
          executed_at: string
        }
        Insert: {
          id?: number
          user_id: string
          portfolio_id: number
          asset_id: number
          transaction_type: 'BUY' | 'SELL'
          quantity: number
          price: number
          total_amount: number
          fee?: number
          executed_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          portfolio_id?: number
          asset_id?: number
          transaction_type?: 'BUY' | 'SELL'
          quantity?: number
          price?: number
          total_amount?: number
          fee?: number
          executed_at?: string
        }
      }
      watchlist: {
        Row: {
          id: number
          user_id: string
          name: string
          description: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          description?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      watchlist_item: {
        Row: {
          id: number
          watchlist_id: number
          asset_id: number
          added_at: string
        }
        Insert: {
          id?: number
          watchlist_id: number
          asset_id: number
          added_at?: string
        }
        Update: {
          id?: number
          watchlist_id?: number
          asset_id?: number
          added_at?: string
        }
      }
      ai_analysis: {
        Row: {
          id: number
          asset_id: number
          analysis_type: 'TECHNICAL' | 'SENTIMENT' | 'PATTERN'
          title: string
          summary: string
          confidence_score: number
          signals: Json
          timeframe: string
          created_at: string
        }
        Insert: {
          id?: number
          asset_id: number
          analysis_type: 'TECHNICAL' | 'SENTIMENT' | 'PATTERN'
          title: string
          summary: string
          confidence_score: number
          signals: Json
          timeframe: string
          created_at?: string
        }
        Update: {
          id?: number
          asset_id?: number
          analysis_type?: 'TECHNICAL' | 'SENTIMENT' | 'PATTERN'
          title?: string
          summary?: string
          confidence_score?: number
          signals?: Json
          timeframe?: string
          created_at?: string
        }
      }
      community_post: {
        Row: {
          id: number
          user_id: string
          title: string
          content: string
          category: string
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          content: string
          category: string
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          content?: string
          category?: string
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      post_like: {
        Row: {
          id: number
          post_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          user_id?: string
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
