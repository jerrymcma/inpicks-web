import { supabase } from './supabase'

export type SubscriptionPlan = 'monthly' | 'yearly'

export interface CreateCheckoutSessionParams {
  userId: string
  plan: SubscriptionPlan
  email: string
}

export interface SubscriptionStatus {
  isSubscribed: boolean
  plan?: SubscriptionPlan
  currentPeriodEnd?: Date
  status?: 'active' | 'canceled' | 'past_due' | 'trialing'
}

export const createCheckoutSession = async ({
  userId,
  plan,
  email,
}: CreateCheckoutSessionParams): Promise<string> => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        plan,
        email,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const { url } = await response.json()
    return url
  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    // Temporary fallback: Redirect to create Payment Links manually in Stripe Dashboard
    console.log('API endpoint not available, showing instructions for manual setup')
    
    const priceId = plan === 'monthly' 
      ? 'price_1SvuwpCWba50iPWenr2rmpel' 
      : 'price_1Sw7KCWba50iPWesACN0a63'
    
    // For now, throw an error with instructions
    throw new Error(`Payment system setup needed:\n\n1. Create Payment Link in Stripe Dashboard for price: ${priceId}\n2. Deploy API endpoints to Vercel\n3. Add environment variables to Vercel\n\nContact support for assistance.`)
  }
}

export const createCustomerPortalSession = async (customerId: string): Promise<string> => {
  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create portal session')
  }

  const { url } = await response.json()
  return url
}

export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_subscribed, subscription_plan, subscription_end_date, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching subscription status:', error)
    return { isSubscribed: false }
  }

  return {
    isSubscribed: profile.is_subscribed || false,
    plan: profile.subscription_plan as SubscriptionPlan,
    currentPeriodEnd: profile.subscription_end_date ? new Date(profile.subscription_end_date) : undefined,
    status: profile.is_subscribed ? 'active' : undefined,
  }
}

export const updateSubscriptionStatus = async (
  userId: string,
  subscription: Partial<SubscriptionStatus>
) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_subscribed: subscription.isSubscribed,
      subscription_plan: subscription.plan,
      subscription_end_date: subscription.currentPeriodEnd?.toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating subscription status:', error)
    throw error
  }
}