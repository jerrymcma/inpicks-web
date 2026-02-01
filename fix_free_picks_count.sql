-- Update all non-subscribed users to have 3 free picks (if they have 5)
-- This fixes existing users who may have been set to 5 instead of 3

UPDATE profiles 
SET free_picks_remaining = 3 
WHERE is_subscribed = false 
AND free_picks_remaining = 5;

-- Also update the table default to ensure new users get 3
ALTER TABLE profiles ALTER COLUMN free_picks_remaining SET DEFAULT 3;

-- Update the trigger function to ensure new users get 3
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, free_picks_remaining, is_subscribed)
    VALUES (NEW.id, NEW.email, 3, FALSE)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;