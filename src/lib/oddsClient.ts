import { Sport } from '../types';

const API_KEY = import.meta.env.VITE_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export interface OddsGame {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
        point?: number;
      }[];
    }[];
  }[];
}

export const oddsClient = {
  async getUpcomingGames(sport: Sport): Promise<OddsGame[]> {
    if (!API_KEY) {
      console.error('ODDS_API_KEY is missing');
      return [];
    }

    let sportKey = '';
    switch (sport) {
      case 'NFL':
        sportKey = 'americanfootball_nfl';
        break;
      case 'NBA':
        sportKey = 'basketball_nba';
        break;
      case 'MLB':
        sportKey = 'baseball_mlb';
        break;
      case 'NHL':
        sportKey = 'icehockey_nhl';
        break;
      default:
        sportKey = 'americanfootball_nfl';
    }

    try {
      const response = await fetch(
        `${BASE_URL}/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals`
      );

      if (!response.ok) {
        throw new Error(`Error fetching games: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching from Odds API:', error);
      return [];
    }
  },

  formatGameTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  },

  getSpread(game: OddsGame): string {
    const spreadMarket = game.bookmakers[0]?.markets.find(
      (m) => m.key === 'spreads'
    );
    if (!spreadMarket) return 'N/A';

    // Find the favorite (negative point spread)
    const favorite = spreadMarket.outcomes.reduce((prev, current) => {
        return (prev.point || 0) < (current.point || 0) ? prev : current;
    });

    if (!favorite || favorite.point === undefined) return 'N/A';

    // Mapping team names to abbreviations is hard without a map.
    // For now, let's just use the team name or a simple heuristic if needed.
    // The existing UI uses abbreviations like "KC -3.5".
    // I'll stick to the team name or maybe just the spread value relative to the favorite.
    
    // Let's try to generate something like "Team -Points"
    // Shorten team name?
    const teamName = favorite.name.split(' ').pop(); // Last word usually works (Chiefs, Bills)
    
    return `${teamName} ${favorite.point}`;
  },

  getOverUnder(game: OddsGame): string {
    const totalMarket = game.bookmakers[0]?.markets.find(
      (m) => m.key === 'totals'
    );
    if (!totalMarket) return 'N/A';

    const overOutcome = totalMarket.outcomes.find(o => o.name === 'Over');
    if (!overOutcome || overOutcome.point === undefined) return 'N/A';

    return `O/U ${overOutcome.point}`;
  }
};
