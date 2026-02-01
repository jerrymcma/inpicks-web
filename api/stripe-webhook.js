const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const buf = Buffer.from(await getRawBody(req))
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).send('Internal Server Error')
  }
}

async function handleCheckoutSessionCompleted(session) {
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

async function handleSubscriptionDeleted(subscription) {
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

async function handleInvoicePaymentSucceeded(invoice) {
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

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}