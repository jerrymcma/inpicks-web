import { Database } from './database'

export type Sport = 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'NCAAF' | 'NCAAMB'

export interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  commenceTime: string
  sport: Sport
  odds: string
  spread?: string
  overUnder?: string
  confidence: number
  aiPrediction: string
}

export type PredictionType = 'MONEYLINE' | 'SPREAD' | 'OVER_UNDER'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserPick = Database['public']['Tables']['user_picks']['Row']

export interface FilterState {
  sport: Sport | 'ALL'
  searchQuery: string
}
