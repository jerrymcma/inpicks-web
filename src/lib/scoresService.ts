import { supabase } from './supabase'

export const scoresService = {
  async updateGameScores(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('update-game-scores', {
        body: {}
      })

      if (error) {
        console.error('Error updating game scores:', error)
        return false
      }

      console.log('Game scores updated:', data)
      return true
    } catch (error) {
      console.error('Exception updating game scores:', error)
      return false
    }
  }
}
