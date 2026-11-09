ALTER TABLE public.push_state ADD COLUMN IF NOT EXISTS cron_secret text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

SELECT cron.unschedule('purollano-notify-song');

SELECT cron.schedule(
  'purollano-notify-song',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://purollanoradio.lovable.app/api/public/notify-song',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT cron_secret FROM public.push_state WHERE id = 1)
    ),
    body := '{}'::jsonb
  );
  $$
);