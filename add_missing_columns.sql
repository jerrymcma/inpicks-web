-- Add missing columns to user_picks table if they don't exist
DO $$ 
BEGIN
    -- Add spread_line if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_picks' 
        AND column_name = 'spread_line'
    ) THEN
        ALTER TABLE public.user_picks ADD COLUMN spread_line DECIMAL;
    END IF;

    -- Add over_under_line if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_picks' 
        AND column_name = 'over_under_line'
    ) THEN
        ALTER TABLE public.user_picks ADD COLUMN over_under_line DECIMAL;
    END IF;

    -- Add prediction_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_picks' 
        AND column_name = 'prediction_type'
    ) THEN
        ALTER TABLE public.user_picks ADD COLUMN prediction_type TEXT DEFAULT 'MONEYLINE' NOT NULL;
    END IF;
END $$;
