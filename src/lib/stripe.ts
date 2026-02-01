import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is required')
}

export const stripePromise = loadStripe(stripePublishableKey)

export const STRIPE_PRICES = {
  MONTHLY: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
  YEARLY: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID,
} as const