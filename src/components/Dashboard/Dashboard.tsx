import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUserPicks } from '../../hooks/useUserPicks'
import { GameCard } from '../GameCard/GameCard'
import { Filters } from '../Filters/Filters'
import { PaywallModal } from '../PaywallModal/PaywallModal'
import { mockGames } from '../../data/mockGames'
import { FilterState, Game } from '../../types'
import { supabase } from '../../lib/supabase'

export const Dashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth()
  const { lockedPicks, lockPick, isPickLocked } = useUserPicks()
  const [filters, setFilters] = useState<FilterState>({
    sport: 'ALL',
    searchQuery: '',
  })
  const [showPaywall, setShowPaywall] = useState(false)

  const filteredGames = mockGames.filter((game) => {
    const sportMatch = filters.sport === 'ALL' || game.sport === filters.sport
    const searchMatch =
      filters.searchQuery === '' ||
      game.homeTeam.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      game.awayTeam.toLowerCase().includes(filters.searchQuery.toLowerCase())
    return sportMatch && searchMatch
  })

  const handleLockPick = async (gameId: string, predictionText: string): Promise<boolean> => {
    if (!user || !profile) return false

    // Check if user can lock pick
    if (!profile.is_subscribed && profile.free_picks_remaining <= 0) {
      setShowPaywall(true)
      return false
    }

    // Lock the pick
    const game = mockGames.find(g => g.id === gameId)
    if (!game) return false

    const success = await lockPick(gameId, game.sport, predictionText)

    if (success && !profile.is_subscribed) {
      // Decrement free picks
      const { error } = await supabase
        .from('profiles')
        .update({ 
          free_picks_remaining: profile.free_picks_remaining - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (!error) {
        await refreshProfile()
      }
    }

    return success
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Today's AI Predictions
          </h2>
          <p className="text-slate-400">
            Lock in your picks powered by advanced AI analysis
          </p>
        </div>

        <Filters filters={filters} onFilterChange={setFilters} />

        {filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              No games found
            </h3>
            <p className="text-slate-500">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isLocked={isPickLocked(game.id)}
                onLockPick={handleLockPick}
              />
            ))}
          </div>
        )}
      </div>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
