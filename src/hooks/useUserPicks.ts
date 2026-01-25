import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Database } from '../types/database'

export const useUserPicks = () => {
  const { user } = useAuth()
  const [lockedPicks, setLockedPicks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserPicks()
    } else {
      setLockedPicks(new Set())
      setLoading(false)
    }
  }, [user])

  const loadUserPicks = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('user_picks')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error loading picks:', error)
    } else if (data) {
      setLockedPicks(new Set(data.map((pick: Database['public']['Tables']['user_picks']['Row']) => pick.game_id)))
    }
    setLoading(false)
  }

  const lockPick = async (
    gameId: string,
    sport: string,
    predictionText: string
  ): Promise<boolean> => {
    if (!user) return false

    const { error } = await supabase
      .from('user_picks')
      .insert({
        user_id: user.id,
        game_id: gameId,
        sport: sport,
        prediction_text: predictionText,
      } as Database['public']['Tables']['user_picks']['Insert'])

    if (error) {
      console.error('Error locking pick:', error)
      return false
    }

    setLockedPicks(prev => new Set([...prev, gameId]))
    return true
  }

  const isPickLocked = (gameId: string): boolean => {
    return lockedPicks.has(gameId)
  }

  return {
    lockedPicks,
    loading,
    lockPick,
    isPickLocked,
    refreshPicks: loadUserPicks,
  }
}
