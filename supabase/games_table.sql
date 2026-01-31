-- Create games table to track live scores and outcomes
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY, -- e.g., 'nfl_chiefs_bills' (should match external API IDs ideally, or map to them)
    sport TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'final', 'postponed'
    home_score INTEGER,
    away_score INTEGER,
    winner TEXT, -- 'home', 'away', 'push'
    spread_result TEXT, -- 'home_cover', 'away_cover', 'push' (optional, for spread tracking)
    total_score INTEGER, -- for over/under
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Everyone can view games
CREATE POLICY "Public can view games"
    ON public.games
    FOR SELECT
    USING (true);

-- Only service role can insert/update (for Edge Functions)
-- Note: Service role bypasses RLS, so strictly we don't need a policy for it, 
-- but we can add one for authenticated admin users if needed.

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_games_sport ON public.games(sport);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_start_time ON public.games(start_time);
