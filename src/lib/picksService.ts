import { supabase } from './supabase'
import { geminiClient } from './geminiClient'
import type { Database } from '../types/database'
import type { Sport } from '../types'

type UserPickInsert = Database['public']['Tables']['user_picks']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type UserPickRow = Database['public']['Tables']['user_picks']['Row']

export const picksService = {
  async generatePrediction(_gameId: string, homeTeam: string, awayTeam: string, sport: Sport): Promise<string> {
    return await geminiClient.analyzeMatchup(sport, homeTeam, awayTeam)
  },

  async lockInPick(userId: string, gameId: string, sport: string, predictionText: string): Promise<boolean> {
    try {
      const newPick: UserPickInsert = {
        user_id: userId,
        game_id: gameId,
        sport,
        prediction_text: predictionText
      }
      // Insert pick into database
      const { error: pickError } = await supabase
        .from('user_picks')
        .insert(newPick)

      if (pickError) {
        console.error('Error locking pick:', pickError)
        return false
      }

      // Decrement free picks
      const { data: profile } = await supabase
        .from('profiles')
        .select('free_picks_remaining, is_subscribed')
        .eq('id', userId)
        .single()

      if (!profile) return false

      // Only decrement if not subscribed and has picks remaining
      if (!profile.is_subscribed && profile.free_picks_remaining > 0) {
        const profileUpdate: ProfileUpdate = { free_picks_remaining: profile.free_picks_remaining - 1 }
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdate)
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

  async getUserPicks(userId: string): Promise<UserPickRow[]> {
    try {
      const { data, error } = await supabase
        .from('user_picks')
        .select('*')
        .eq('user_id', userId)


      if (error) {
        throw error
      }

      return (data as UserPickRow[]) || []
    } catch (error) {
      console.error('Error fetching picks:', error)
      return []
    }
  },

  async unlockPick(userId: string, gameId: string): Promise<boolean> {
    try {
      // Delete pick from database
      const { error: deleteError } = await supabase
        .from('user_picks')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId)

      if (deleteError) {
        console.error('Error unlocking pick:', deleteError)
        return false
      }

      // Increment free picks
      const { data: profile } = await supabase
        .from('profiles')
        .select('free_picks_remaining, is_subscribed')
        .eq('id', userId)
        .single()

      if (!profile) return false

      // Only increment if not subscribed
      if (!profile.is_subscribed) {
        const profileUpdate: ProfileUpdate = { free_picks_remaining: profile.free_picks_remaining + 1 }
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating picks:', updateError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error in unlockPick:', error)
      return false
    }
  }
}
