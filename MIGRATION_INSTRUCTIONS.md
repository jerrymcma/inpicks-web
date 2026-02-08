# Database Migration Instructions

## Step 1: Run the Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add team name columns to user_picks table so we can match games by team names
-- instead of relying on game_id matching between different APIs

ALTER TABLE public.user_picks
ADD COLUMN IF NOT EXISTS home_team TEXT,
ADD COLUMN IF NOT EXISTS away_team TEXT;

-- Create index for faster lookups by team names
CREATE INDEX IF NOT EXISTS idx_user_picks_teams 
ON public.user_picks(home_team, away_team, sport);

-- Update existing picks to have team names if they're in the prediction text
-- This is a best-effort migration for existing data
UPDATE public.user_picks
SET 
  home_team = CASE 
    WHEN prediction_text LIKE '%@ %' THEN 
      TRIM(SPLIT_PART(prediction_text, '@', 2))
    ELSE NULL
  END,
  away_team = CASE 
    WHEN prediction_text LIKE '%@ %' THEN 
      TRIM(SPLIT_PART(prediction_text, '@', 1))
    ELSE NULL
  END
WHERE home_team IS NULL AND away_team IS NULL;
```

## Step 2: Set Up SportRadar API Keys

You need API keys from SportRadar to fetch live scores:

1. Go to https://developer.sportradar.com/
2. Sign up and get API keys for NFL and NBA
3. Add them to your Supabase Edge Function environment variables:
   - `NFL_API` - Your NFL API key
   - `NBA_API` - Your NBA API key

## Step 3: Deploy the Updated Edge Function

```bash
# From your project root
npx supabase functions deploy update-game-scores
```

## Step 4: Set Up a Cron Job

To automatically update scores, set up a cron job to call the edge function:

1. In Supabase Dashboard, go to Database > Cron Jobs
2. Create a new cron job:
   - Name: `update-game-scores`
   - Schedule: `*/5 * * * *` (every 5 minutes during game times)
   - Command: Call your edge function

Or use an external service like GitHub Actions or Vercel Cron Jobs:

```yaml
# .github/workflows/update-scores.yml
name: Update Game Scores
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-scores:
    runs-on: ubuntu-latest
    steps:
      - name: Call score update function
        run: |
          curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-game-scores \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

## How It Works

### The Problem We Fixed:
- User picks were stored with game IDs from the Odds API
- Score updates came from SportRadar API with different game IDs
- Picks never matched, so they stayed "Pending" forever

### The Solution:
1. **Store team names** when users lock in picks
2. **Match by team names** instead of game IDs when updating scores
3. **Handle team name variations** (e.g., "Kansas City Chiefs" vs "Chiefs")
4. **Support all prediction types**: Moneyline, Spread, and Over/Under

### Win Rate Calculation:
- Only counts picks with `game_status = 'completed'`
- Calculates percentage of `is_correct = true` picks
- Updates automatically via real-time subscriptions
- Displays in both Dashboard and Record views
