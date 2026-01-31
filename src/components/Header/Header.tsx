import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'

interface HeaderProps {
  onViewChange: (view: 'dashboard' | 'record') => void
}

export const Header: React.FC<HeaderProps> = ({ onViewChange }) => {
  const { user } = useAuth()
  const { profile } = useProfile()

  return (
    <header className="bg-surface border-b border-slate-700/50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-start">
          <button 
            onClick={() => onViewChange('dashboard')}
            className="logo-text cursor-pointer"
          >
            <span className="logo-in">In</span>
            <span className="logo-picks">picks</span>
          </button>

          <div className="flex flex-col items-end gap-1">
            {user && (
              <div className="text-right">
                <div className="text-sm font-medium text-white">{user.email}</div>
                {profile && (
                  <div className="text-xs text-secondary mb-1">
                    {profile.is_subscribed ? (
                      <span className="text-primary">Unlimited Picks ∞</span>
                    ) : (
                      `${profile.free_picks_remaining} free picks remaining`
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
