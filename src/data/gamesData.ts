import type { Game, Sport } from '../types'

export const nflGames: Game[] = [
  {
    id: 'nfl_chiefs_bills',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    time: 'Sun, 6:30 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NFL',
    odds: 'KC -3.5',
    confidence: 87,
    aiPrediction: 'Chiefs win by 3-7 points'
  },
  {
    id: 'nfl_49ers_packers',
    homeTeam: 'Green Bay Packers',
    awayTeam: 'San Francisco 49ers',
    time: 'Sun, 8:20 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NFL',
    odds: 'SF -6.5',
    confidence: 92,
    aiPrediction: '49ers win by 10+ points'
  },
  {
    id: 'nfl_ravens_bengals',
    homeTeam: 'Cincinnati Bengals',
    awayTeam: 'Baltimore Ravens',
    time: 'Mon, 8:15 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NFL',
    odds: 'BAL -3',
    confidence: 85,
    aiPrediction: 'Ravens cover the spread'
  }
]

export const nbaGames: Game[] = [
  {
    id: 'nba_lakers_celtics',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    time: 'Thu, 7:30 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NBA',
    odds: 'BOS -4.5',
    confidence: 78,
    aiPrediction: 'Celtics win, over 225.5 total'
  },
  {
    id: 'nba_warriors_nets',
    homeTeam: 'Brooklyn Nets',
    awayTeam: 'Golden State Warriors',
    time: 'Thu, 7:30 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NBA',
    odds: 'GSW -2.5',
    confidence: 75,
    aiPrediction: 'Warriors win'
  },
  {
    id: 'nba_heat_bucks',
    homeTeam: 'Milwaukee Bucks',
    awayTeam: 'Miami Heat',
    time: 'Fri, 8:00 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NBA',
    odds: 'MIL -5',
    confidence: 81,
    aiPrediction: 'Bucks win and cover'
  }
]

export const nhlGames: Game[] = [
  {
    id: 'nhl_bruins_rangers',
    homeTeam: 'New York Rangers',
    awayTeam: 'Boston Bruins',
    time: 'Sat, 7:00 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NHL',
    odds: 'NYR -1.5',
    confidence: 82,
    aiPrediction: 'Rangers win, over 6.5 goals'
  },
  {
    id: 'nhl_leafs_canadiens',
    homeTeam: 'Montreal Canadiens',
    awayTeam: 'Toronto Maple Leafs',
    time: 'Sat, 7:00 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NHL',
    odds: 'TOR -1.5',
    confidence: 79,
    aiPrediction: 'Leafs win and cover'
  },
  {
    id: 'nhl_avalanche_stars',
    homeTeam: 'Dallas Stars',
    awayTeam: 'Colorado Avalanche',
    time: 'Sun, 8:00 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NHL',
    odds: 'COL -1.5',
    confidence: 85,
    aiPrediction: 'Avalanche dominate, under 6.5'
  }
]

export const ncaambGames: Game[] = [
  {
    id: 'ncaamb_duke_unc',
    homeTeam: 'North Carolina',
    awayTeam: 'Duke',
    time: 'Sat, 12:00 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NCAAMB',
    odds: 'DUKE -3.5',
    confidence: 88,
    aiPrediction: 'Duke wins rivalry game'
  },
  {
    id: 'ncaamb_kansas_kentucky',
    homeTeam: 'Kentucky',
    awayTeam: 'Kansas',
    time: 'Sat, 2:00 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NCAAMB',
    odds: 'KU -2.5',
    confidence: 76,
    aiPrediction: 'Kansas covers in tight game'
  },
  {
    id: 'ncaamb_gonzaga_ucla',
    homeTeam: 'UCLA',
    awayTeam: 'Gonzaga',
    time: 'Sun, 4:00 PM',
    commenceTime: '2026-12-31T00:00:00Z',
    sport: 'NCAAMB',
    odds: 'GONZ -4',
    confidence: 83,
    aiPrediction: 'Gonzaga wins big, over 155.5'
  }
]

export const getGamesBySport = (sport: Sport): Game[] => {
  if (sport === 'NFL') return nflGames
  if (sport === 'NBA') return nbaGames
  if (sport === 'NHL') return nhlGames
  if (sport === 'NCAAMB') return ncaambGames
  return []
}
