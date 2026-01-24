export interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  time: string
  sport: string
}

export interface UserProfile {
  id: string
  email: string | null
  freePicksRemaining: number
  isSubscribed: boolean
  nextRefillAt: string | null
}

export interface UserPick {
  id: string
  userId: string
  gameId: string
  sport: string
  predictionText: string
  createdAt: string
}

export type Sport = 'NFL' | 'NBA'
