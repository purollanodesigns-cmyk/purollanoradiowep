CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'purollano-notify-song',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://purollanoradio.lovable.app/api/public/notify-song',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.push_cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);