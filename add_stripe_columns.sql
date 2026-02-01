-- Add Stripe subscription columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_email TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);

-- Update RLS policies if needed (assuming they already exist for profiles table)
-- The existing policies should cover these new columns as they're part of the same table