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
    if (!profile.is_subscribed && profile.free_picks_remaining <= 0) {
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
      if (!profile.is_subscribed && profile.free_picks_remaining <= 1) {
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
    return userPicks.find(pick => pick.game_id === gameId)
  }

  const completedPicks = userPicks.filter(pick => pick.game_status === 'completed')
  const winRate = completedPicks.length > 0
    ? ((completedPicks.filter(pick => pick.is_correct).length / completedPicks.length) * 100).toFixed(1)
    : '0'

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Performance Header */}
      <div className="performance-card">
        <div className="text-sm text-secondary font-semibold mb-2 uppercase tracking-wide">
          Your Performance
        </div>
        <div className="text-4xl font-bold text-white mb-1">{winRate}%</div>
        <div className="text-sm text-secondary/80">Win Rate</div>
      </div>

      {/* Free Picks Status */}
      {user && profile && !profile.is_subscribed && (
        <div className="card-secondary">
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">
              Free picks left: <span className="font-bold">{profile.free_picks_remaining}</span>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="btn-primary"
            >
              Go Unlimited
            </button>
          </div>
        </div>
      )}

      {!user && (
        <div className="card-secondary">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-primary min-w-[110px] whitespace-nowrap"
            >
              Sign In
            </button>
            <div className="text-white">
              to use 3 free picks
            </div>
          </div>
        </div>
      )}

      {/* Sport Selector */}
      <div className="flex gap-2">
        {(['NFL', 'NBA'] as Sport[]).map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              selectedSport === sport
                ? 'btn-primary'
                : 'btn-secondary hover:bg-slate-700'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Games List */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Upcoming {selectedSport} Games</h3>
        <div className="space-y-3">
          {games.map(game => {
            const userPick = getPickForGame(game.id)
            const isLockedIn = !!userPick
            const canViewPick = user && profile && (profile.is_subscribed || profile.free_picks_remaining > 0)

            return (
              <div key={game.id} className="card">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white mb-1">
                    {game.awayTeam} @ {game.homeTeam}
                  </h4>
                  <p className="text-secondary text-sm">{game.time}</p>
                </div>

                {isLockedIn ? (
                  <button
                    onClick={() => handleViewLockedPick(game, userPick.prediction_text)}
                    className="w-full bg-primary py-3 rounded-lg font-semibold transition-all text-white"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Locked In Pick
                    </span>
                  </button>
                ) : canViewPick ? (
                  <button
                    onClick={() => handleViewPick(game)}
                    className="w-full btn-secondary"
                  >
                    View Pick
                  </button>
                ) : (
                  <button
                    onClick={() => user ? setShowSubscriptionModal(true) : setShowAuthModal(true)}
                    className="w-full btn-primary"
                  >
                    {user ? 'Unlock Unlimited Picks' : 'Sign In to View Picks'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
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
