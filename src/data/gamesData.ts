import type { Game } from '../types'

export const nflGames: Game[] = [
  {
    id: 'nfl_chiefs_bills',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    time: 'Sun, 6:30 PM',
    sport: 'NFL'
  },
  {
    id: 'nfl_49ers_packers',
    homeTeam: 'Green Bay Packers',
    awayTeam: 'San Francisco 49ers',
    time: 'Sun, 8:20 PM',
    sport: 'NFL'
  },
  {
    id: 'nfl_ravens_bengals',
    homeTeam: 'Cincinnati Bengals',
    awayTeam: 'Baltimore Ravens',
    time: 'Mon, 8:15 PM',
    sport: 'NFL'
  }
]

export const nbaGames: Game[] = [
  {
    id: 'nba_lakers_celtics',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    time: 'Thu, 7:30 PM',
    sport: 'NBA'
  },
  {
    id: 'nba_warriors_nets',
    homeTeam: 'Brooklyn Nets',
    awayTeam: 'Golden State Warriors',
    time: 'Thu, 7:30 PM',
    sport: 'NBA'
  },
  {
    id: 'nba_heat_bucks',
    homeTeam: 'Milwaukee Bucks',
    awayTeam: 'Miami Heat',
    time: 'Fri, 8:00 PM',
    sport: 'NBA'
  }
]

export const getGamesBySport = (sport: string): Game[] => {
  return sport === 'NFL' ? nflGames : nbaGames
}
