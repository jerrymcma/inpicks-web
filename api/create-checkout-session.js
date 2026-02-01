import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, plan, email } = req.body

    if (!userId || !plan || !email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const priceId = plan === 'monthly' 
      ? process.env.VITE_STRIPE_MONTHLY_PRICE_ID 
      : process.env.VITE_STRIPE_YEARLY_PRICE_ID

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan or missing price ID' })
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.DOMAIN}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/dashboard`,
      metadata: {
        userId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
    })

    res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}