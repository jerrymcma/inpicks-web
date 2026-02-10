import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { picksService } from '../../lib/picksService'
import { oddsClient } from '../../lib/oddsClient'
import { scoresService } from '../../lib/scoresService'
import { AuthModal } from '../Auth/AuthModal'
import { PredictionModal } from '../Prediction/PredictionModal'
import { SubscriptionModal } from '../Subscription/SubscriptionModal'
import { BaseballIcon, BasketballIcon, HockeyIcon, CollegeBasketballIcon } from '../Icons'
import type { Game, Sport, UserPick, PredictionType } from '../../types'

interface DashboardProps {
  onViewChange: (view: 'dashboard' | 'record') => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user, signOut } = useAuth()
  const { profile, refetchProfile } = useProfile()

  const [selectedSport, setSelectedSport] = useState<Sport>('MLB')
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
  const [selectedPredictionType, setSelectedPredictionType] = useState<PredictionType>('MONEYLINE')
  const [predictionsCache, setPredictionsCache] = useState<Record<string, string>>({})
  const [usingMockData, setUsingMockData] = useState(false)

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
      console.log('🏈 Dashboard: Fetching games for sport:', selectedSport)
      const oddsGames = await oddsClient.getUpcomingGames(selectedSport)
      console.log('📋 Dashboard: Raw odds games received:', oddsGames.length)
      
      // Always use real API data only
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
      
      setUsingMockData(false)
      console.log('🎲 Dashboard: Formatted games:', formattedGames.length)
      console.log('🎮 Dashboard: First formatted game:', formattedGames[0])
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

  // Subscribe to realtime updates so completed results and win rate reflect immediately
  useEffect(() => {
    if (!user) return

    const unsubscribe = picksService.subscribeToUserPicks(user.id, async () => {
      const picks = await picksService.getUserPicks(user.id)
      setUserPicks(picks)
    })

    return () => {
      unsubscribe?.()
    }
  }, [user])

  // Update game scores on component mount (if user is signed in)
  useEffect(() => {
    if (user) {
      scoresService.updateGameScores()
    }
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

  const handlePredictionButton = async (game: Game, type: PredictionType) => {
    const lockedPick = getPickForGame(game.id, type)
    setSelectedGame(game)
    setSelectedPredictionType(type)
    setShowPredictionModal(true)

    if (lockedPick) {
      setCurrentPrediction(lockedPick.prediction_text)
      setIsGenerating(false)
      return
    }

    setCurrentPrediction('')
    setIsGenerating(true)

    const cacheKey = `${game.id}_${type}`
    const cached = predictionsCache[cacheKey]
    if (cached) {
      setCurrentPrediction(cached)
      setIsGenerating(false)
      return
    }

    const prediction = await picksService.generatePrediction(
      game.id,
      game.homeTeam,
      game.awayTeam,
      game.sport,
      type,
      type === 'SPREAD' ? game.spread : undefined,
      type === 'OVER_UNDER' ? game.overUnder : undefined
    )

    setCurrentPrediction(prediction)
    setPredictionsCache(prev => ({ ...prev, [cacheKey]: prediction }))
    setIsGenerating(false)
  }


  const handleLockInPick = async () => {
    if (!user) {
      setPendingLockIn(true)
      setShowPredictionModal(false)
      setShowAuthModal(true)
      return
    }

    if (!profile) {
      console.error('No profile found')
      return
    }

    // Check if user has picks available
    if (!profile.is_subscribed && profile.free_picks_remaining <= 0) {
      setShowPredictionModal(false)
      setShowSubscriptionModal(true)
      return
    }

    if (!selectedGame) {
      console.error('No game selected')
      return
    }

    if (!currentPrediction) {
      console.error('No prediction available')
      return
    }

    setIsLockingIn(true)
    console.log('Locking pick:', {
      userId: user.id,
      gameId: selectedGame.id,
      sport: selectedGame.sport,
      predictionType: selectedPredictionType,
      predictionLength: currentPrediction.length
    })
    
    const success = await picksService.lockInPick(
      user.id,
      selectedGame.id,
      selectedGame.sport,
      currentPrediction,
      selectedPredictionType,
      selectedPredictionType === 'SPREAD' ? selectedGame.spread : undefined,
      selectedPredictionType === 'OVER_UNDER' ? selectedGame.overUnder : undefined,
      selectedGame.homeTeam,
      selectedGame.awayTeam
    )

    console.log('Lock pick result:', success)

    if (success) {
      await refetchProfile()
      const picks = await picksService.getUserPicks(user.id)
      setUserPicks(picks)
      setShowPredictionModal(false)

      // Show subscription modal if this was the last free pick
      if (!profile.is_subscribed && profile.free_picks_remaining <= 1) {
        setShowSubscriptionModal(true)
      }
    } else {
      console.error('Failed to lock pick')
      alert('Failed to lock pick. Please check the console for errors.')
    }

    setIsLockingIn(false)
  }

  const handleUnlockPick = async () => {
    if (!user || !selectedGame) return

    setIsLockingIn(true) // Reusing state for loading
    const success = await picksService.unlockPick(user.id, selectedGame.id, selectedPredictionType)
    
    if (success) {
      await refetchProfile()
      const picks = await picksService.getUserPicks(user.id)
      setUserPicks(picks)
      setShowPredictionModal(false)
    }
    setIsLockingIn(false)
  }

  const getPickForGame = (gameId: string, predictionType?: PredictionType): UserPick | undefined => {
    return userPicks.find(pick => pick.game_id === gameId && (!predictionType || pick.prediction_type === predictionType))
  }

  const completedPicks = userPicks.filter(pick => pick.game_status === 'completed')
  const winRate = completedPicks.length > 0
    ? ((completedPicks.filter(pick => pick.is_correct).length / completedPicks.length) * 100).toFixed(1)
    : '0'

  const freePicksRemaining = user && profile ? profile.free_picks_remaining : 0
  const clampedFreePicks = Math.min(Math.max(freePicksRemaining, 0), 3)
  const shouldShowUnlockCta = Boolean(user && profile && !profile.is_subscribed && freePicksRemaining <= 0)

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
      <div className="grid grid-cols-2 gap-2">
        {(['MLB', 'NBA', 'NHL', 'NCAAMB'] as Sport[]).map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedSport === sport
                ? 'btn-primary'
                : 'btn-secondary hover:bg-slate-700'
            }`}
          >
            {sport === 'MLB' && <BaseballIcon />}
            {sport === 'NBA' && <BasketballIcon />}
            {sport === 'NHL' && <HockeyIcon />}
            {sport === 'NCAAMB' && <CollegeBasketballIcon />}
            {sport}
          </button>
        ))}
      </div>

      {/* Games List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">Upcoming {selectedSport} Games</h3>
            {usingMockData && (
              <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded-md">
                Demo Mode
              </span>
            )}
          </div>
          <button
            onClick={async () => {
              await scoresService.updateGameScores()
              if (user) {
                const picks = await picksService.getUserPicks(user.id)
                setUserPicks(picks)
              }
            }}
            className="px-3 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          {games.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No upcoming {selectedSport} games scheduled at this time.
            </div>
          ) : (
            <>
              {(() => {
                console.log('🏟️ Rendering games list, games count:', games.length);
                return null;
              })()}
              {games.map(game => {
            const hasSpread = Boolean(game.spread && !game.spread.toLowerCase().includes('n/a'))
            const hasOverUnder = Boolean(game.overUnder && !game.overUnder.toLowerCase().includes('n/a'))
            const moneylineLocked = Boolean(getPickForGame(game.id, 'MONEYLINE'))
            const spreadLocked = hasSpread && Boolean(getPickForGame(game.id, 'SPREAD'))
            const overUnderLocked = hasOverUnder && Boolean(getPickForGame(game.id, 'OVER_UNDER'))

            return (
              <div key={game.id} className="card">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white mb-1">
                    {game.awayTeam} @ {game.homeTeam}
                  </h4>
                  <div className="flex gap-3 mb-2">
                    <span className="text-primary text-sm font-bold bg-primary/10 px-2 py-1 rounded">
                      {game.spread}
                    </span>
                    <span className="text-primary text-sm font-bold bg-primary/10 px-2 py-1 rounded">
                      {game.overUnder}
                    </span>
                  </div>
                  <p className="text-secondary text-sm">{game.time}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handlePredictionButton(game, 'MONEYLINE')}
                    className={`w-full py-3 rounded-lg font-semibold transition-all text-white ${moneylineLocked ? 'bg-primary' : 'bg-blue-600 hover:bg-blue-500'}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {moneylineLocked && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {moneylineLocked ? 'Locked In' : 'Pick Winner'}
                    </span>
                  </button>

                  {(hasSpread || hasOverUnder) && (
                    <div className="flex gap-3">
                      {hasSpread && (
                        <button
                          onClick={() => handlePredictionButton(game, 'SPREAD')}
                          className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white ${spreadLocked ? 'bg-primary' : 'btn-primary'}`}
                        >
                          <span className="text-center block">
                            {spreadLocked ? 'Locked In' : 'Spread'}
                          </span>
                        </button>
                      )}
                      {hasOverUnder && (
                        <button
                          onClick={() => handlePredictionButton(game, 'OVER_UNDER')}
                          className={`flex-1 py-3 rounded-lg font-semibold transition-all text-white ${overUnderLocked ? 'bg-primary' : 'btn-primary'}`}
                        >
                          <span className="text-center block">
                            {overUnderLocked ? 'Locked In' : 'Over/Under'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {!profile?.is_subscribed && (
                    <div className="text-xs text-white/60">
                      {clampedFreePicks} of 3 free picks
                    </div>
                  )}

                  {shouldShowUnlockCta && (
                    <button
                      onClick={() => setShowSubscriptionModal(true)}
                      className="w-full py-3 rounded-lg font-semibold transition-all text-white bg-primary"
                    >
                      Unlock Unlimited Picks
                    </button>
                  )}
                </div>
              </div>
            )
          })}
            </>
          )}
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
          isLockedIn={!!getPickForGame(selectedGame.id, selectedPredictionType)}
          predictionType={selectedPredictionType}
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
