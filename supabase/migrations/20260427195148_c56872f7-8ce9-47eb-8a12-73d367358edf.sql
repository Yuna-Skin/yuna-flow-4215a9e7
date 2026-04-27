-- Enable pg_cron extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a daily keepalive ping at 03:00 UTC
-- This runs a lightweight SELECT inside the database itself to register activity
-- and prevent the project from being paused due to inactivity.
SELECT cron.schedule(
  'daily-keepalive-ping',
  '0 3 * * *',
  $$SELECT 1;$$
);