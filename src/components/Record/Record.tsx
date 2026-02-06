import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { picksService } from '../../lib/picksService'
import { FootballIcon, BasketballIcon } from '../Icons'
import type { UserPick } from '../../types'
import { formatPredictionText } from '../../lib/utils'

export const Record: React.FC = () => {
  const { user } = useAuth()
  const [userPicks, setUserPicks] = useState<UserPick[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserPicks = async () => {
      if (user) {
        setLoading(true)
        const picks = await picksService.getUserPicks(user.id)
        setUserPicks(picks)
        setLoading(false)
      }
    }
    loadUserPicks()
  }, [user])

  useEffect(() => {
    if (!user) return

    // Subscribe to updates on user_picks to reflect completed results and update win rate
    const unsubscribe = picksService.subscribeToUserPicks(user.id, async () => {
      const picks = await picksService.getUserPicks(user.id)
      setUserPicks(picks)
    })

    return () => {
      unsubscribe?.()
    }
  }, [user])

  const getPickResult = (pick: UserPick) => {
    if (pick.game_status !== 'completed') return 'pending'
    return pick.is_correct ? 'win' : 'loss'
  }

  const completedPicks = userPicks.filter(pick => pick.game_status === 'completed')
  const winRate = completedPicks.length > 0 
    ? ((completedPicks.filter(pick => pick.is_correct).length / completedPicks.length) * 100).toFixed(1)
    : '0'

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-secondary">Please sign in to view your pick history.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Performance Summary */}
      <div className="performance-card">
        <div className="text-sm text-secondary font-semibold mb-2 uppercase tracking-wide">
          Your Performance
        </div>
        <div className="text-4xl font-bold text-white mb-1">{winRate}%</div>
        <div className="text-sm text-secondary/80">
          {completedPicks.filter(pick => pick.is_correct).length} wins out of {completedPicks.length} completed picks
        </div>
      </div>

      {/* Picks History */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Record</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-secondary">Loading your picks...</div>
          </div>
        ) : userPicks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-secondary">No picks yet. Start by locking in some predictions!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {userPicks.map(pick => {
              const result = getPickResult(pick)
              return (
                <div key={pick.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                        {pick.sport === 'NFL' && <FootballIcon />}
                        {pick.sport === 'NBA' && <BasketballIcon />}
                        {pick.sport} Game
                      </h4>
                      <p className="text-secondary text-sm">
                        {new Date(pick.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                        result === 'win' ? 'bg-green-900/30 text-green-win' :
                        result === 'loss' ? 'bg-red-900/30 text-red-400' :
                        'bg-slate-900/30 text-secondary'
                      }`}>
                        {result === 'pending' ? 'Pending' : result === 'win' ? 'Win' : 'Loss'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-600/30">
                    <div className="text-primary text-xs font-semibold uppercase tracking-wide mb-2">
                      Your Prediction
                    </div>
                    <p className="text-white font-medium mb-2">{formatPredictionText(pick.prediction_text)}</p>
                    
                    {pick.game_final_score && (
                      <div className="text-secondary text-sm">
                        Final Score: {pick.game_final_score}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}