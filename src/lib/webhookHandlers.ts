import { supabase } from './supabase'

interface StripeSession {
  customer_email: string
  metadata: {
    userId: string
    plan: 'monthly' | 'yearly'
  }
  subscription: string
}

interface StripeSubscription {
  id: string
  customer: string
  metadata: {
    userId: string
    plan: 'monthly' | 'yearly'
  }
  current_period_end: number
  status: string
}

export const handleCheckoutSessionCompleted = async (session: StripeSession) => {
  const { userId, plan } = session.metadata

  if (!userId) {
    console.error('No userId in session metadata')
    return
  }

  try {
    const subscriptionEndDate = new Date()
    if (plan === 'monthly') {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
    } else {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_subscribed: true,
        subscription_plan: plan,
        subscription_end_date: subscriptionEndDate.toISOString(),
        stripe_customer_email: session.customer_email,
        stripe_subscription_id: session.subscription,
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating subscription status:', error)
    } else {
      console.log(`Subscription activated for user ${userId}, plan: ${plan}`)
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

export const handleSubscriptionDeleted = async (subscription: StripeSubscription) => {
  const { userId } = subscription.metadata

  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_subscribed: false,
        subscription_plan: null,
        subscription_end_date: null,
      })
      .eq('id', userId)

    if (error) {
      console.error('Error canceling subscription:', error)
    } else {
      console.log(`Subscription canceled for user ${userId}`)
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

export const handleInvoicePaymentSucceeded = async (invoice: any) => {
  const subscription = invoice.subscription_object || invoice.lines?.data?.[0]?.subscription_item?.subscription
  
  if (!subscription?.metadata?.userId) {
    console.log('No userId found in invoice subscription metadata')
    return
  }

  const { userId, plan } = subscription.metadata
  
  try {
    const subscriptionEndDate = new Date()
    if (plan === 'monthly') {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
    } else {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_subscribed: true,
        subscription_end_date: subscriptionEndDate.toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating subscription renewal:', error)
    } else {
      console.log(`Subscription renewed for user ${userId}`)
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}