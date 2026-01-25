import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Database } from '../../types/database'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

interface SubscriptionModalProps {
  onClose: () => void
  onSuccess: () => void
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) return

    setLoading(true)

    // For demo purposes, directly update the subscription status
    // In production, integrate with Stripe or your payment processor
    const profileUpdate: ProfileUpdate = { is_subscribed: true }
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (!error) {
      onSuccess()
    } else {
      console.error('Error subscribing:', error)
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Go Unlimited</h2>

        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700 rounded-lg p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-white mb-2">$9.99</div>
            <div className="text-purple-300">per month</div>
          </div>

          <div className="space-y-3 text-white">
            <div className="flex items-center gap-3">
              <div className="text-green-400 text-xl">✓</div>
              <div>Unlimited AI Picks</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-green-400 text-xl">✓</div>
              <div>All Sports Coverage</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-green-400 text-xl">✓</div>
              <div>Advanced Analytics</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-green-400 text-xl">✓</div>
              <div>Priority Support</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 text-white py-3 rounded-lg font-semibold transition-all mb-3"
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </button>

        <button
          onClick={onClose}
          className="w-full text-slate-400 hover:text-white transition-colors"
        >
          Maybe Later
        </button>

        <p className="text-xs text-slate-500 text-center mt-4">
          Demo mode - Subscription will be activated immediately
        </p>
      </div>
    </div>
  )
}
