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
