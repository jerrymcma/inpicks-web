import React, { useState } from 'react'
import { Game } from '../../types'
import { useAuth } from '../../context/AuthContext'

interface GameCardProps {
  game: Game
  isLocked: boolean
  onLockPick: (gameId: string, predictionText: string) => Promise<boolean>
}

export const GameCard: React.FC<GameCardProps> = ({ game, isLocked, onLockPick }) => {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)

  const gameDate = new Date(game.time)
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const formattedTime = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const canLockPick = user && profile && (profile.is_subscribed || profile.free_picks_remaining > 0)

  const handleLockClick = async () => {
    if (!canLockPick || isLocked || loading) return

    setLoading(true)
    const success = await onLockPick(game.id, game.aiPrediction)
    setLoading(false)

    if (success && profile && !profile.is_subscribed) {
      // Profile will be refreshed by parent component
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-400'
    if (confidence >= 70) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      NFL: 'bg-purple-600',
      NBA: 'bg-orange-600',
      MLB: 'bg-blue-600',
      NHL: 'bg-cyan-600',
      NCAAF: 'bg-red-600',
      NCAAB: 'bg-indigo-600',
    }
    return colors[sport] || 'bg-slate-600'
  }

  return (
    <div className="card hover:border-primary/30 transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <span className={`${getSportColor(game.sport)} text-white text-xs font-bold px-3 py-1 rounded-full`}>
          {game.sport}
        </span>
        <div className="text-right">
          <div className="text-secondary text-sm">{formattedDate}</div>
          <div className="text-white text-sm font-medium">{formattedTime}</div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">{game.awayTeam}</span>
          <span className="text-secondary text-sm">@</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">{game.homeTeam}</span>
          {game.odds && (
            <span className="text-secondary text-sm font-mono">{game.odds}</span>
          )}
        </div>
      </div>

      <div className="bg-slate-900/30 rounded-lg p-4 mb-4 border border-slate-600/30">
        <div className="flex items-start justify-between mb-2">
          <span className="text-primary text-xs font-semibold uppercase tracking-wide">
            AI Prediction
          </span>
          <span className={`text-sm font-bold ${getConfidenceColor(game.confidence)}`}>
            {game.confidence}% confidence
          </span>
        </div>
        <p className="text-white font-medium">{game.aiPrediction}</p>
      </div>

      <button
        onClick={handleLockClick}
        disabled={!canLockPick || isLocked || loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
          isLocked
            ? 'bg-primary text-white cursor-default'
            : canLockPick
            ? 'btn-primary'
            : 'btn-secondary opacity-50 cursor-not-allowed'
        }`}
      >
        {loading ? (
          'Locking...'
        ) : isLocked ? (
          <span className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Locked In</span>
          </span>
        ) : canLockPick ? (
          'Lock In Pick'
        ) : (
          'Sign in to lock pick'
        )}
      </button>
    </div>
  )
}
