import { Game } from '../types'

export const mockGames: Game[] = [
  {
    id: 'nfl-1',
    sport: 'NFL',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    time: '2026-02-09T18:00:00Z',
    commenceTime: '2026-02-09T18:00:00Z',
    aiPrediction: 'Chiefs win by 3-7 points',
    confidence: 87,
    odds: 'KC -3.5',
    spread: 'KC -3.5',
    overUnder: 'O/U 54.5'
  },
  {
    id: 'nfl-2',
    sport: 'NFL',
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Detroit Lions',
    time: '2026-02-09T21:30:00Z',
    commenceTime: '2026-02-09T21:30:00Z',
    aiPrediction: '49ers win by 10+ points',
    confidence: 92,
    odds: 'SF -6.5',
    spread: 'SF -6.5',
    overUnder: 'O/U 51.5'
  },
  {
    id: 'nba-1',
    sport: 'NBA',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    time: '2026-02-08T02:00:00Z',
    commenceTime: '2026-02-08T02:00:00Z',
    aiPrediction: 'Celtics win, over 225.5 total',
    confidence: 78,
    odds: 'BOS -4.5',
    spread: 'BOS -4.5',
    overUnder: 'O/U 225.5'
  },
  {
    id: 'nba-2',
    sport: 'NBA',
    homeTeam: 'Milwaukee Bucks',
    awayTeam: 'Phoenix Suns',
    time: '2026-02-08T01:00:00Z',
    commenceTime: '2026-02-08T01:00:00Z',
    aiPrediction: 'Bucks win close game',
    confidence: 73,
    odds: 'MIL -2',
    spread: 'MIL -2',
    overUnder: 'O/U 222.5'
  },
  {
    id: 'nba-3',
    sport: 'NBA',
    homeTeam: 'Denver Nuggets',
    awayTeam: 'Dallas Mavericks',
    time: '2026-02-08T03:00:00Z',
    commenceTime: '2026-02-08T03:00:00Z',
    aiPrediction: 'Nuggets cover spread',
    confidence: 81,
    odds: 'DEN -5',
    spread: 'DEN -5',
    overUnder: 'O/U 238.5'
  },
  {
    id: 'nhl-1',
    sport: 'NHL',
    homeTeam: 'Toronto Maple Leafs',
    awayTeam: 'Edmonton Oilers',
    time: '2026-01-25T00:00:00Z',
    commenceTime: '2026-01-25T00:00:00Z',
    aiPrediction: 'Oilers win in regulation',
    confidence: 76,
    odds: 'EDM -1.5'
  },
  {
    id: 'ncaab-1',
    sport: 'NCAAB',
    homeTeam: 'Duke Blue Devils',
    awayTeam: 'North Carolina Tar Heels',
    time: '2026-01-25T00:00:00Z',
    commenceTime: '2026-01-25T00:00:00Z',
    aiPrediction: 'Duke wins by 5-10 points',
    confidence: 84,
    odds: 'DUKE -7'
  },
  {
    id: 'ncaab-2',
    sport: 'NCAAB',
    homeTeam: 'Kansas Jayhawks',
    awayTeam: 'Kentucky Wildcats',
    time: '2026-01-25T01:30:00Z',
    commenceTime: '2026-01-25T01:30:00Z',
    aiPrediction: 'Kansas covers at home',
    confidence: 79,
    odds: 'KU -4.5'
  },
]
