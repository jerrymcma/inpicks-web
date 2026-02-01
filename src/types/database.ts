export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          email: string | null
          free_picks_remaining: number
          id: string
          is_subscribed: boolean
          next_refill_at: string | null
          subscription_plan: string | null
          subscription_end_date: string | null
          stripe_customer_id: string | null
          stripe_customer_email: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          free_picks_remaining?: number
          id: string
          is_subscribed?: boolean
          next_refill_at?: string | null
          subscription_plan?: string | null
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
          stripe_customer_email?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          free_picks_remaining?: number
          id?: string
          is_subscribed?: boolean
          next_refill_at?: string | null
          subscription_plan?: string | null
          subscription_end_date?: string | null
          stripe_customer_id?: string | null
          stripe_customer_email?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_picks: {
        Row: {
          id: string
          user_id: string
          game_id: string
          sport: string
          prediction_type: string
          prediction_text: string
          predicted_outcome: string | null
          actual_outcome: string | null
          is_correct: boolean | null
          game_final_score: string | null
          spread_line: number | null
          over_under_line: number | null
          game_status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          sport: string
          prediction_type?: string
          prediction_text: string
          predicted_outcome?: string | null
          actual_outcome?: string | null
          is_correct?: boolean | null
          game_final_score?: string | null
          spread_line?: number | null
          over_under_line?: number | null
          game_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          sport?: string
          prediction_type?: string
          prediction_text?: string
          predicted_outcome?: string | null
          actual_outcome?: string | null
          is_correct?: boolean | null
          game_final_score?: string | null
          spread_line?: number | null
          over_under_line?: number | null
          game_status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}