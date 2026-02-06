import { supabase } from './supabase'
import { geminiClient } from './geminiClient'
import type { Database } from '../types/database'
import type { Sport, PredictionType } from '../types'

type UserPickInsert = Database['public']['Tables']['user_picks']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type UserPickRow = Database['public']['Tables']['user_picks']['Row']

const parseLineValue = (line?: string): number | null => {
  if (!line) return null
  const match = line.match(/-?\d+(\.\d+)?/)
  return match ? Number(match[0]) : null
}

const extractPredictedOutcome = (
  predictionText: string,
  homeTeam: string,
  awayTeam: string,
  predictionType: PredictionType
): string => {
  // Extract the predicted outcome from AI text
  const lowerText = predictionText.toLowerCase()

  if (predictionType === 'OVER_UNDER') {
    // Look for "Over" or "Under" in the prediction
    if (lowerText.includes('pick: over') || lowerText.includes('take the over')) {
      return 'Over'
    } else if (lowerText.includes('pick: under') || lowerText.includes('take the under')) {
      return 'Under'
    }
    return 'Unknown'
  }

  // For MONEYLINE and SPREAD, determine home or away
  const winnerMatch = predictionText.match(/Winner:\s*([^\n]+)/i) || 
                      predictionText.match(/Pick:\s*([^\n]+)/i)

  if (winnerMatch) {
    const winner = winnerMatch[1].trim()
    // Check if the winner matches home or away team
    if (winner.toLowerCase().includes(homeTeam.toLowerCase())) {
      return 'home'
    } else if (winner.toLowerCase().includes(awayTeam.toLowerCase())) {
      return 'away'
    }
  }

  // Fallback: check if home or away team is mentioned more prominently
  if (lowerText.includes(homeTeam.toLowerCase()) && !lowerText.includes(awayTeam.toLowerCase())) {
    return 'home'
  } else if (lowerText.includes(awayTeam.toLowerCase()) && !lowerText.includes(homeTeam.toLowerCase())) {
    return 'away'
  }

  return 'Unknown'
}

export const picksService = {
  async generatePrediction(
    _gameId: string,
    homeTeam: string,
    awayTeam: string,
    sport: Sport,
    predictionType: PredictionType = 'MONEYLINE',
    spreadLine?: string,
    overUnderLine?: string
  ): Promise<string> {
    switch (predictionType) {
      case 'SPREAD':
        return await geminiClient.analyzeSpread(sport, homeTeam, awayTeam, spreadLine)
      case 'OVER_UNDER':
        return await geminiClient.analyzeOverUnder(sport, homeTeam, awayTeam, overUnderLine)
      default:
        return await geminiClient.analyzeMatchup(sport, homeTeam, awayTeam)
    }
  },

  async lockInPick(
    userId: string,
    gameId: string,
    sport: string,
    predictionText: string,
    predictionType: PredictionType,
    spreadLine?: string,
    overUnderLine?: string,
    homeTeam?: string,
    awayTeam?: string
  ): Promise<boolean> {
    try {
      // Extract predicted outcome from AI text
      const predictedOutcome = homeTeam && awayTeam 
        ? extractPredictedOutcome(predictionText, homeTeam, awayTeam, predictionType)
        : 'Unknown'

      const newPick: UserPickInsert = {
        user_id: userId,
        game_id: gameId,
        sport,
        prediction_type: predictionType,
        prediction_text: predictionText,
        predicted_outcome: predictedOutcome,
        spread_line: parseLineValue(spreadLine),
        over_under_line: parseLineValue(overUnderLine)
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
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data as UserPickRow[]) || []
    } catch (error) {
      console.error('Error fetching picks:', error)
      return []
    }
  },

  subscribeToUserPicks(userId: string, onChange: () => void): () => void {
    const channel = supabase
      .channel(`user_picks_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_picks', filter: `user_id=eq.${userId}` },
        () => {
          try {
            onChange()
          } catch (e) {
            console.error('Error handling user_picks change:', e)
          }
        }
      )
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (e) {
        console.error('Error unsubscribing from user_picks channel:', e)
      }
    }
  },

  async unlockPick(userId: string, gameId: string, predictionType: PredictionType): Promise<boolean> {
    try {
      // Delete pick from database for the specific prediction type
      const { error: deleteError } = await supabase
        .from('user_picks')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .eq('prediction_type', predictionType)

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
