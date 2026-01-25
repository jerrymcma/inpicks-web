export type Sport = 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'NCAAF' | 'NCAAB'

export interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  sport: Sport
  odds: string
  confidence: number
  aiPrediction: string
}

export interface Profile {
  id: string
  email: string | null
  free_picks_remaining: number
  is_subscribed: boolean
  next_refill_at: string | null
}

export interface UserPick {
  id: string
  user_id: string
  game_id: string
  sport: string
  prediction_text: string
  created_at: string
}

export interface FilterState {
  sport: Sport | 'ALL'
  searchQuery: string
}
