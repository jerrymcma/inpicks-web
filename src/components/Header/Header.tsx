import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'

export const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()

  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">InPicks AI</h1>
            <div className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              82% Win Rate
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-slate-300">{profile?.email}</div>
                {profile && (
                  <div className="text-xs text-slate-400">
                    {profile.isSubscribed ? (
                      <span className="text-green-400">Unlimited Picks ∞</span>
                    ) : (
                      `${profile.freePicksRemaining} free picks remaining`
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={signOut}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
