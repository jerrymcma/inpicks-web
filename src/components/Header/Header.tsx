import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AuthModal } from '../Auth/AuthModal'

export const Header: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <h1 className="text-xl font-bold text-white">Sports Picks</h1>
            </div>

            <div className="flex items-center space-x-4">
              {user && profile && (
                <div className="hidden sm:flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                  <span className="text-sm text-slate-300">
                    {profile.is_subscribed ? (
                      <span className="text-primary-400 font-semibold">Premium</span>
                    ) : (
                      <span>
                        Free picks: <span className="font-semibold text-white">{profile.free_picks_remaining}</span>
                      </span>
                    )}
                  </span>
                </div>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-white text-sm">{user.email}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2">
                      <button
                        onClick={() => {
                          signOut()
                          setShowUserMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
