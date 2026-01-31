-- Enable the pg_cron extension (requires a database restart in some environments if not already enabled)
create extension if not exists pg_cron;

-- Schedule the update-game-scores function to run every hour
-- The function URL will need to be updated with your actual project Reference ID and Token if making an HTTP request,
-- or simply invoke the function if using Supabase native cron (if available).

-- NOTE: Supabase typically requires invoking Edge Functions via HTTP from pg_cron.
-- Replace 'PROJECT_REF' and 'ANON_KEY' with your actual values if running this in SQL Editor manually.
-- For a more robust setup, use the dashboard to set up the cron job or use the pg_net extension to make the call.

-- Example using pg_net (recommended for HTTP calls from Postgres)
create extension if not exists pg_net;

-- Schedule: Every hour at minute 0
select
  cron.schedule(
    'update-game-scores-hourly',
    '0 * * * *',
    $$
    select
      net.http_post(
          url:='https://undrycsywxjowvwinhcf.supabase.co/functions/v1/update-game-scores',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- To verify scheduled jobs:
-- select * from cron.job;

-- To unschedule:
-- select cron.unschedule('update-game-scores-hourly');
