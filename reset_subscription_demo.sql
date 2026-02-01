-- Reset subscription status for users who were incorrectly marked as subscribed in demo mode
-- This fixes the issue where users appear to have unlimited picks without paying

UPDATE profiles 
SET 
    is_subscribed = false,
    subscription_plan = NULL,
    subscription_end_date = NULL,
    stripe_customer_id = NULL,
    stripe_customer_email = NULL,
    stripe_subscription_id = NULL,
    free_picks_remaining = 3
WHERE is_subscribed = true 
AND (stripe_customer_id IS NULL OR stripe_subscription_id IS NULL);

-- This query will:
-- 1. Set is_subscribed to false
-- 2. Clear all subscription-related fields
-- 3. Reset free picks to 3
-- 4. Only affects users who are marked as subscribed but don't have Stripe data
--    (meaning they were set to subscribed in demo mode)