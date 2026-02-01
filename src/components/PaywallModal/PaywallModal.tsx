import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createCheckoutSession } from '../../lib/stripeService'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) return
    
    setLoading(plan)
    
    try {
      const checkoutUrl = await createCheckoutSession({
        userId: user.id,
        plan,
        email: user.email!,
      })
      
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-lg w-full border border-slate-700 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Upgrade to Premium
          </h2>
          <p className="text-slate-400 mb-6">
            You've used all your free picks. Unlock unlimited AI-powered predictions!
          </p>

          <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-700">
            <div className="text-left space-y-3">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Unlimited picks across all sports</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Advanced AI analysis & insights</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Real-time updates & notifications</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Priority customer support</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-600 rounded-xl p-4 relative">
                <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  BEST VALUE
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">$149/year</div>
                  <div className="text-green-300 text-sm">$12.42/month</div>
                  <button
                    onClick={() => handleSubscribe('yearly')}
                    disabled={loading === 'yearly'}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    {loading === 'yearly' ? 'Loading...' : 'Subscribe Yearly'}
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-900/50 border border-slate-600 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">$19/month</div>
                  <div className="text-slate-400 text-sm">Monthly billing</div>
                  <button
                    onClick={() => handleSubscribe('monthly')}
                    disabled={loading === 'monthly'}
                    className="w-full mt-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    {loading === 'monthly' ? 'Loading...' : 'Subscribe Monthly'}
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-3 px-6 text-slate-400 hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
