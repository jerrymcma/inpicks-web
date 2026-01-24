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
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { picksService } from '../../lib/picksService'
import { getGamesBySport } from '../../data/gamesData'
import { AuthModal } from '../Auth/AuthModal'
import { PredictionModal } from '../Prediction/PredictionModal'
import { SubscriptionModal } from '../Subscription/SubscriptionModal'
import type { Game, Sport, UserPick } from '../../types'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { profile, refetchProfile } = useProfile()

  const [selectedSport, setSelectedSport] = useState<Sport>('NFL')
  const [games, setGames] = useState<Game[]>([])
  const [userPicks, setUserPicks] = useState<UserPick[]>([])

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPredictionModal, setShowPredictionModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [currentPrediction, setCurrentPrediction] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLockingIn, setIsLockingIn] = useState(false)

  // Load games when sport changes
  useEffect(() => {
    setGames(getGamesBySport(selectedSport))
  }, [selectedSport])

  // Load user picks when user changes
  useEffect(() => {
    const loadUserPicks = async () => {
      if (user) {
        const picks = await picksService.getUserPicks(user.id)
        setUserPicks(picks)
      } else {
        setUserPicks([])
      }
    }
    loadUserPicks()
  }, [user])

  const handleViewPick = async (game: Game) => {
    setSelectedGame(game)
    setIsGenerating(true)
    setShowPredictionModal(true)

    const prediction = await picksService.generatePrediction(
      game.id,
      game.sport,
      game.homeTeam,
      game.awayTeam
    )

    setCurrentPrediction(prediction)
    setIsGenerating(false)
  }

  const handleLockInPick = async () => {
    if (!user) {
      setShowPredictionModal(false)
      setShowAuthModal(true)
      return
    }

    if (!profile) return

    // Check if user has picks available
    if (!profile.isSubscribed && profile.freePicksRemaining <= 0) {
      setShowPredictionModal(false)
      setShowSubscriptionModal(true)
      return
    }

    if (!selectedGame) return

    setIsLockingIn(true)
    const success = await picksService.lockInPick(
      user.id,
      selectedGame.id,
      selectedGame.sport,
      currentPrediction
    )

    if (success) {
      await refetchProfile()
      const picks = await picksService.getUserPicks(user.id)
      setUserPicks(picks)
      setShowPredictionModal(false)

      // Show subscription modal if this was the last free pick
      if (!profile.isSubscribed && profile.freePicksRemaining <= 1) {
        setShowSubscriptionModal(true)
      }
    }

    setIsLockingIn(false)
  }

  const handleViewLockedPick = (game: Game, prediction: string) => {
    setSelectedGame(game)
    setCurrentPrediction(prediction)
    setShowPredictionModal(true)
  }

  const getPickForGame = (gameId: string): UserPick | undefined => {
    return userPicks.find(pick => pick.gameId === gameId)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Performance Header */}
      <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-6 mb-8 text-center">
        <h2 className="text-lg text-purple-200 mb-2">InPicks AI Performance</h2>
        <div className="text-5xl font-bold text-white mb-1">82%</div>
        <div className="text-sm text-purple-300">Win Rate - Last 30 Days</div>
      </div>

      {/* Sport Selector */}
      <div className="flex gap-3 mb-6">
        {(['NFL', 'NBA'] as Sport[]).map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              selectedSport === sport
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Free Picks Status */}
      {user && profile && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              {profile.isSubscribed ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-lg font-semibold">Unlimited Picks</span>
                  <span className="text-2xl">∞</span>
                </div>
              ) : (
                <div>
                  <div className="text-slate-300">
                    <span className="text-xl font-bold text-white">{profile.freePicksRemaining}</span> of 3 free picks remaining
                  </div>
                </div>
              )}
            </div>
            {!profile.isSubscribed && (
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                Go Unlimited
              </button>
            )}
          </div>
        </div>
      )}

      {!user && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-slate-300">
              Sign in to unlock your 3 free AI picks
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Games List */}
      <h3 className="text-2xl font-bold text-white mb-4">Upcoming {selectedSport} Games</h3>
      <div className="space-y-4">
        {games.map(game => {
          const userPick = getPickForGame(game.id)
          const isLockedIn = !!userPick
          const canViewPick = user && profile && (profile.isSubscribed || profile.freePicksRemaining > 0)

          return (
            <div key={game.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="mb-4">
                <h4 className="text-xl font-bold text-white mb-2">
                  {game.awayTeam} @ {game.homeTeam}
                </h4>
                <p className="text-slate-400">{game.time}</p>
              </div>

              {isLockedIn ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleViewLockedPick(game, userPick.predictionText)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    Locked In Pick ✓
                  </button>
                  {!profile?.isSubscribed && (
                    <p className="text-center text-sm text-slate-400">
                      {profile?.freePicksRemaining} of 3 free picks remaining
                    </p>
                  )}
                </div>
              ) : canViewPick ? (
                <button
                  onClick={() => handleViewPick(game)}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  View Pick
                </button>
              ) : (
                <button
                  onClick={() => user ? setShowSubscriptionModal(true) : setShowAuthModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  {user ? 'Unlock Unlimited Picks' : 'Sign In to View Picks'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showPredictionModal && selectedGame && (
        <PredictionModal
          game={selectedGame}
          prediction={currentPrediction}
          isGenerating={isGenerating}
          isLockingIn={isLockingIn}
          isLockedIn={!!getPickForGame(selectedGame.id)}
          onLockIn={handleLockInPick}
          onClose={() => setShowPredictionModal(false)}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={async () => {
            await refetchProfile()
            setShowSubscriptionModal(false)
          }}
        />
      )}
    </div>
  )
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
