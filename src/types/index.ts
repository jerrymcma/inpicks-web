export interface Profile {
  id: string
  email: string | null
  free_picks_remaining: number
  is_subscribed: boolean
  next_refill_at: string | null
  created_at: string
  updated_at: string
}

export interface UserPick {
  id: string
  user_id: string
  game_id: string
  sport: string
  prediction_text: string
  created_at: string
}

export interface Game {
  id: string
  sport: string
  homeTeam: string
  awayTeam: string
  gameTime: string
  aiPrediction: string
  confidence: number
  odds?: string
}

export type Sport = 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'NCAAF' | 'NCAAB'

export interface FilterState {
  sport: Sport | 'ALL'
  searchQuery: string
}
