import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata.userId
  const plan = session.metadata.plan
  const customerId = session.customer

  if (!userId) {
    console.error('No userId in session metadata')
    return
  }

  // Update user profile with subscription info
  const { error } = await supabase
    .from('profiles')
    .update({
      is_subscribed: true,
      subscription_plan: plan,
      stripe_customer_id: customerId,
      subscription_status: 'active',
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating profile after checkout:', error)
    throw error
  }

  console.log(`Subscription activated for user ${userId}`)
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer
  const status = subscription.status
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  // Find user by customer ID
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (findError || !profile) {
    console.error('Could not find user for customer:', customerId)
    return
  }

  // Update subscription status
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_end_date: currentPeriodEnd.toISOString(),
      is_subscribed: status === 'active',
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

  console.log(`Subscription updated for customer ${customerId}: ${status}`)
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer

  // Find user by customer ID
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (findError || !profile) {
    console.error('Could not find user for customer:', customerId)
    return
  }

  // Cancel subscription
  const { error } = await supabase
    .from('profiles')
    .update({
      is_subscribed: false,
      subscription_status: 'canceled',
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }

  console.log(`Subscription canceled for customer ${customerId}`)
}

async function handleInvoicePaymentSucceeded(invoice) {
  // Handle successful recurring payments
  const customerId = invoice.customer
  
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (findError || !profile) {
    console.error('Could not find user for customer:', customerId)
    return
  }

  // Ensure subscription is active
  const { error } = await supabase
    .from('profiles')
    .update({
      is_subscribed: true,
      subscription_status: 'active',
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating subscription after payment:', error)
    throw error
  }

  console.log(`Payment succeeded for customer ${customerId}`)
}

async function handleInvoicePaymentFailed(invoice) {
  // Handle failed payments
  const customerId = invoice.customer
  
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (findError || !profile) {
    console.error('Could not find user for customer:', customerId)
    return
  }

  // Mark subscription as past due
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating subscription after failed payment:', error)
    throw error
  }

  console.log(`Payment failed for customer ${customerId}`)
}