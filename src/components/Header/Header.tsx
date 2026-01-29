import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'

interface HeaderProps {
  onViewChange: (view: 'dashboard' | 'record') => void
  currentView: 'dashboard' | 'record'
}

export const Header: React.FC<HeaderProps> = ({ onViewChange, currentView }) => {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()

  return (
    <header className="bg-surface border-b border-slate-700/50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onViewChange('dashboard')}
              className="logo-text cursor-pointer"
            >
              <span className="logo-in">In</span>
              <span className="logo-picks">picks</span>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => onViewChange('record')}
              className={`text-sm transition-colors font-medium ${
                currentView === 'record' 
                  ? 'text-accent' 
                  : 'text-primary hover:text-accent'
              }`}
            >
              Record
            </button>
            
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{user.email}</div>
                  {profile && (
                    <div className="text-xs text-secondary">
                      {profile.is_subscribed ? (
                        <span className="text-primary">Unlimited Picks ∞</span>
                      ) : (
                        `${profile.free_picks_remaining} free picks remaining`
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={signOut}
                  className="text-sm text-secondary hover:text-primary transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
