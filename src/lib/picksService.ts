import { supabase } from './supabase'
import type { UserPick, Profile } from '../types'

export const picksService = {
  async generatePrediction(gameId: string, homeTeam: string, awayTeam: string): Promise<string> {
    // Simulate AI prediction generation with delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock prediction based on game
    const predictions: Record<string, string> = {
      'nfl_chiefs_bills': 'Chiefs to win by 3-7 points. Their offense has been explosive, averaging 28 points per game.',
      'nfl_49ers_packers': 'Packers slight edge at home. Look for a close game decided in the 4th quarter.',
      'nfl_ravens_bengals': 'Ravens defense dominates. Take the under on total points.',
      'nba_lakers_celtics': 'Celtics win convincingly at home. Their defense will limit Lakers to under 105 points.',
      'nba_warriors_nets': 'Warriors by 5+. Curry expected to have a big game in Brooklyn.',
      'nba_heat_bucks': 'Bucks cover the spread. Giannis matchup advantage against Heat frontcourt.'
    }

    return predictions[gameId] || `AI analysis suggests a competitive matchup between ${awayTeam} and ${homeTeam}.`
  },

  async lockInPick(userId: string, gameId: string, sport: string, predictionText: string): Promise<boolean> {
    try {
      // Insert pick into database
      const { error: pickError } = await supabase
        .from('user_picks')
        .insert({
          user_id: userId,
          game_id: gameId,
          sport,
          prediction_text: predictionText
        })

      if (pickError) {
        console.error('Error locking pick:', pickError)
        return false
      }

      // Decrement free picks
      const { data: profile } = await supabase
        .from('profiles')
        .select('free_picks_remaining, is_subscribed')
        .eq('id', userId)
        .single<Pick<Profile, 'free_picks_remaining' | 'is_subscribed'>>()

      if (!profile) return false

      // Only decrement if not subscribed and has picks remaining
      if (!profile.is_subscribed && profile.free_picks_remaining > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ free_picks_remaining: profile.free_picks_remaining - 1 })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating picks:', updateError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error in lockInPick:', error)
      return false
    }
  },

  async getUserPicks(userId: string): Promise<UserPick[]> {
    try {
      const { data, error } = await supabase
        .from('user_picks')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error fetching picks:', error)
      return []
    }
  }
}
