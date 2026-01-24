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
      profiles: {
        Row: {
          id: string
          email: string | null
          free_picks_remaining: number
          is_subscribed: boolean
          next_refill_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          free_picks_remaining?: number
          is_subscribed?: boolean
          next_refill_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          free_picks_remaining?: number
          is_subscribed?: boolean
          next_refill_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_picks: {
        Row: {
          id: string
          user_id: string
          game_id: string
          sport: string
          prediction_text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          sport: string
          prediction_text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          sport?: string
          prediction_text?: string
          created_at?: string
        }
      }
    }
  }
}
