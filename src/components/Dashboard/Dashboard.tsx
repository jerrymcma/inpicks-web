import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { picksService } from '../../lib/picksService'
import { oddsClient } from '../../lib/oddsClient'
import { AuthModal } from '../Auth/AuthModal'
import { PredictionModal } from '../Prediction/PredictionModal'
import { SubscriptionModal } from '../Subscription/SubscriptionModal'
import { FootballIcon, BasketballIcon } from '../Icons'
import type { Game, Sport, UserPick } from '../../types'

interface DashboardProps {
  onViewChange: (view: 'dashboard' | 'record') => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user, signOut } = useAuth()
  const { profile, refetchProfile } = useProfile()

  const [selectedSport, setSelectedSport] = useState<Sport>('NFL')
  const [games, setGames] = useState<Game[]>([])
  const [userPicks, setUserPicks] = useState<UserPick[]>([])
  
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPredictionModal, setShowPredictionModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  // Menu states
  const [showMenu, setShowMenu] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [currentPrediction, setCurrentPrediction] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLockingIn, setIsLockingIn] = useState(false)
  const [pendingLockIn, setPendingLockIn] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load games when sport changes
  useEffect(() => {
    const fetchGames = async () => {
      const oddsGames = await oddsClient.getUpcomingGames(selectedSport)
      const formattedGames: Game[] = oddsGames.map(g => ({
        id: g.id,
        homeTeam: g.home_team,
        awayTeam: g.away_team,
        time: oddsClient.formatGameTime(g.commence_time),
        commenceTime: g.commence_time,
        sport: selectedSport,
        odds: oddsClient.getSpread(g),
        spread: oddsClient.getSpread(g),
        overUnder: oddsClient.getOverUnder(g),
        confidence: 0, // Placeholder until AI analysis
        aiPrediction: '' // Placeholder until AI analysis
      }))
      setGames(formattedGames)
    }
    fetchGames()
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

  // Handle pending lock-in after sign in
  useEffect(() => {
    if (user && profile && pendingLockIn && selectedGame) {
      const completePendingLockIn = async () => {
        // Only trigger if we have the necessary data
        // Reset pending state immediately to prevent double submission
        setPendingLockIn(false)
        
        // Re-open prediction modal if it was closed (optional, but good for context)
        setShowPredictionModal(true)
        
        await handleLockInPick()
      }
      completePendingLockIn()
    }
  }, [user, profile, pendingLockIn, selectedGame])

  const handleViewPick = async (game: Game) => {
    setSelectedGame(game)
    setIsGenerating(true)
    setShowPredictionModal(true)

    const prediction = await picksService.generatePrediction(
      game.id,
      game.homeTeam,
      game.awayTeam,
      game.sport
    )

    setCurrentPrediction(prediction)
    setIsGenerating(false)
  }


  const handleLockInPick = async () => {
    if (!user) {
      setPendingLockIn(true)
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

  const handleUnlockPick = async () => {
    if (!user || !selectedGame) return

    setIsLockingIn(true) // Reusing state for loading
    const success = await picksService.unlockPick(user.id, selectedGame.id)
    
    if (success) {
      await refetchProfile()
      const picks = await picksService.getUserPicks(user.id)
      setUserPicks(picks)
      setShowPredictionModal(false)
    }
    setIsLockingIn(false)
  }

  const getPickForGame = (gameId: string): UserPick | undefined => {
    return userPicks.find(pick => pick.game_id === gameId)
  }

  const completedPicks = userPicks.filter(pick => pick.game_status === 'completed')
  const winRate = completedPicks.length > 0
    ? ((completedPicks.filter(pick => pick.is_correct).length / completedPicks.length) * 100).toFixed(1)
    : '0'

  return (
    <div className="container mx-auto px-4 py-2 space-y-6">
      {/* Top Controls */}
      <div className="flex justify-between items-center -mb-4 relative z-10">
        <button 
          onClick={() => onViewChange('record')}
          className="text-base text-primary hover:text-accent font-medium transition-colors"
        >
          Record
        </button>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-secondary hover:text-white transition-colors p-1"
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] border border-slate-700 rounded-lg shadow-xl overflow-hidden">
              <button 
                onClick={() => { setShowTerms(true); setShowMenu(false); }} 
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700/50"
              >
                Terms
              </button>
              <button 
                onClick={() => { setShowPrivacy(true); setShowMenu(false); }} 
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors border-b border-slate-700/50"
              >
                Privacy
              </button>
              {user && (
                <button 
                  onClick={() => { signOut(); setShowMenu(false); }} 
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Performance Header */}
      <div className="performance-card">
        <div className="text-sm text-primary font-semibold mb-2 uppercase tracking-wide">
          Your Performance
        </div>
        <div className="text-4xl font-bold text-white mb-1">{winRate}%</div>
        <div className="text-base text-accent font-medium">Win Rate</div>
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
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedSport === sport
                ? 'btn-primary'
                : 'btn-secondary hover:bg-slate-700'
            }`}
          >
            {sport === 'NFL' && <FootballIcon />}
            {sport === 'NBA' && <BasketballIcon />}
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

            return (
              <div key={game.id} className="card">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white mb-1">
                    {game.awayTeam} @ {game.homeTeam}
                  </h4>
                  <div className="flex gap-3 mb-2">
                    <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded">
                      {game.spread}
                    </span>
                    <span className="text-accent text-xs font-bold bg-accent/10 px-2 py-1 rounded">
                      {game.overUnder}
                    </span>
                  </div>
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
                ) : (
                  <button
                    onClick={() => handleViewPick(game)}
                    className="w-full btn-primary"
                  >
                    View Pick
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
          onUnlock={handleUnlockPick}
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

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-slate-700 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Terms of Service</h2>
            <div className="text-slate-300 space-y-4 text-sm mb-6">
              <p>This service is for entertainment purposes only.</p>
              <p>The AI-generated picks provided by Inpicks are not financial advice and should not be relied upon for gambling or betting decisions.</p>
              <p>Inpicks is not a gambling site and does not accept or place bets. We are not responsible for any financial losses or outcomes resulting from the use of this information.</p>
              <p>By using this service, you acknowledge that you are accessing this content for entertainment only.</p>
            </div>
            <button
              onClick={() => setShowTerms(false)}
              className="w-full py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-slate-700 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Privacy Policy</h2>
            <div className="text-slate-300 space-y-4 text-sm mb-6">
              <p>We value your privacy and are committed to protecting your personal information.</p>
              <p>Your data is securely stored and never sold to or shared with third parties for marketing purposes.</p>
              <p>We only collect essential information required to provide our prediction services and manage your account.</p>
            </div>
            <button
              onClick={() => setShowPrivacy(false)}
              className="w-full py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
