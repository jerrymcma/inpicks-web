# Environment Variables Setup Guide

This document explains how to configure environment variables for the Inpicks application.

## Local Development (.env file)

The following variables are needed in your `.env` file for local development:

### Frontend Variables (require VITE_ prefix)
These are accessible in the browser:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `VITE_ODDS_API_KEY` - The Odds API key for fetching game odds
- `VITE_GEMINI_API_KEY` - Google Gemini AI API key for predictions
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (public)
- `VITE_STRIPE_MONTHLY_PRICE_ID` - Stripe price ID for monthly subscription
- `VITE_STRIPE_YEARLY_PRICE_ID` - Stripe price ID for yearly subscription

### Backend Variables (NO VITE_ prefix)
These are used by serverless functions and backend code:
- `MLB_API` - SportRadar API key for MLB data
- `NBA_API` - SportRadar API key for NBA data
- `STRIPE_SECRET_KEY` - Stripe secret key (private)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_MONTHLY_PRICE_ID` - Stripe price ID for monthly subscription (backend)
- `STRIPE_YEARLY_PRICE_ID` - Stripe price ID for yearly subscription (backend)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (private)
- `DOMAIN` - Your production domain URL

## Vercel Deployment

When deploying to Vercel, add these environment variables in the Vercel dashboard:

### All VITE_ prefixed variables from above, plus:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_YEARLY_PRICE_ID`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DOMAIN`
- `CRON_SECRET` (optional, for securing cron endpoints)

**Note:** Vercel automatically loads .env files, but production secrets should be set in the Vercel dashboard for security.

## Supabase Edge Functions

For the `update-game-scores` edge function to work, you need to set these secrets in your Supabase dashboard:

Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Add these secrets:
- `MLB_API` - SportRadar API key for MLB
- `NBA_API` - SportRadar API key for NBA
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

**Important:** These are separate from your local .env file. You must set them in Supabase dashboard.

## API Keys Information

### SportRadar API
- Both `MLB_API` and `NBA_API` use the same SportRadar API key
- Free trial available at: https://developer.sportradar.com/
- Trial endpoints have rate limits (1 request per second)

### The Odds API
- Used for fetching betting lines and odds
- Get your key at: https://the-odds-api.com/
- Free tier: 500 requests/month

### Google Gemini API
- Used for AI-powered game predictions
- Get your key at: https://ai.google.dev/
- Free tier available

### Stripe API
- Used for payment processing
- Get keys at: https://dashboard.stripe.com/apikeys
- Use test keys for development, live keys for production

## Troubleshooting

**Issue:** Edge function not updating scores
- Check that `MLB_API` and `NBA_API` are set in Supabase Edge Functions secrets
- Check function logs in Supabase dashboard
- Verify API keys are valid

**Issue:** Frontend can't fetch data
- Ensure all `VITE_` prefixed variables are set
- Restart dev server after changing .env file
- Check browser console for error messages

**Issue:** Stripe webhook failing
- Verify `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint secret
- Check Stripe dashboard webhook logs
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
