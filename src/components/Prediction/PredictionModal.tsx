import React from 'react'
import type { Game, PredictionType } from '../../types'
import { formatPredictionText } from '../../lib/utils'

interface PredictionModalProps {
  game: Game
  prediction: string
  predictionType: PredictionType
  isGenerating: boolean
  isLockingIn: boolean
  isLockedIn: boolean
  onLockIn: () => void
  onUnlock: () => void
  onClose: () => void
}

export const PredictionModal: React.FC<PredictionModalProps> = ({
  game,
  prediction,
  predictionType,
  isGenerating,
  isLockingIn,
  isLockedIn,
  onLockIn,
  onUnlock,
  onClose
}) => {
  const gameStarted = new Date() > new Date(game.commenceTime)
  const typeLabel = predictionType === 'SPREAD'
    ? 'Spread'
    : predictionType === 'OVER_UNDER'
      ? 'Over/Under'
      : 'Matchup'

  const title = isGenerating
    ? `Analyzing ${typeLabel}...`
    : isLockedIn
      ? `Your Locked In ${typeLabel} Pick`
      : `InPicks ${typeLabel} Prediction`

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-slate-400 mb-4">{typeLabel} analysis powered by InPicks AI</p>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {game.awayTeam} @ {game.homeTeam}
          </h3>
          <p className="text-slate-400">{game.time}</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6 min-h-[120px] flex items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-slate-400">Generating AI prediction...</p>
            </div>
          ) : (
            <p className="text-white leading-relaxed">{formatPredictionText(prediction)}</p>
          )}
        </div>

        <div className="flex gap-3">
          {!isLockedIn && !isGenerating && (
            <button
              onClick={onLockIn}
              disabled={isLockingIn}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-all"
            >
              {isLockingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Locking In...
                </span>
              ) : (
                'Lock In Pick'
              )}
            </button>
          )}

          {isLockedIn && !gameStarted && !isGenerating && (
            <button
              onClick={onUnlock}
              disabled={isLockingIn}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-3 rounded-lg font-semibold border border-red-600/30 transition-all"
            >
              {isLockingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                  Unlocking...
                </span>
              ) : (
                'Unlock Pick'
              )}
            </button>
          )}

          {!isLockingIn && (
            <button
              onClick={onClose}
              className={`${isLockedIn || isGenerating ? 'flex-1' : 'flex-none px-6'} bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-all`}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
