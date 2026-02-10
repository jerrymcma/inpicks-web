-- Add missing columns to user_picks table

-- Add game_status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_picks' AND column_name='game_status') THEN
        ALTER TABLE public.user_picks ADD COLUMN game_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Add home_team if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_picks' AND column_name='home_team') THEN
        ALTER TABLE public.user_picks ADD COLUMN home_team TEXT;
    END IF;
END $$;

-- Add away_team if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_picks' AND column_name='away_team') THEN
        ALTER TABLE public.user_picks ADD COLUMN away_team TEXT;
    END IF;
END $$;

-- Add updated_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_picks' AND column_name='updated_at') THEN
        ALTER TABLE public.user_picks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add index for game_status
CREATE INDEX IF NOT EXISTS idx_user_picks_game_status ON public.user_picks(game_status);

-- Add policy to allow service role to update picks (for game completion)
DROP POLICY IF EXISTS "Service can update picks" ON public.user_picks;
CREATE POLICY "Service can update picks"
    ON public.user_picks
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Verify columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_picks'
ORDER BY ordinal_position;
