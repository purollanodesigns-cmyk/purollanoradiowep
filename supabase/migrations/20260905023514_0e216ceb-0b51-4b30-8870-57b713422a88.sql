CREATE TABLE IF NOT EXISTS public.visit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.visit_events TO authenticated;
GRANT ALL ON public.visit_events TO service_role;

ALTER TABLE public.visit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read visit events" ON public.visit_events
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS visit_events_created_at_idx ON public.visit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS visit_events_country_idx ON public.visit_events (country);

CREATE OR REPLACE FUNCTION public.log_visit(_country text DEFAULT NULL)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c text;
  _total bigint;
BEGIN
  _c := upper(nullif(trim(coalesce(_country, '')), ''));
  IF _c !~ '^[A-Z]{2}$' THEN _c := NULL; END IF;
  INSERT INTO public.visit_events (country) VALUES (_c);
  _total := public.increment_visits();
  RETURN _total;
END;
$$;

REVOKE ALL ON FUNCTION public.log_visit(text) FROM public;
GRANT EXECUTE ON FUNCTION public.log_visit(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_visit_stats(_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _h integer := least(greatest(coalesce(_hours, 24), 1), 168);
  _res jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'total', (SELECT coalesce(total, 0) FROM public.site_visits WHERE id = 1),
    'tracked', (SELECT count(*) FROM public.visit_events),
    'last_24h', (SELECT count(*) FROM public.visit_events WHERE created_at > now() - interval '24 hours'),
    'last_7d', (SELECT count(*) FROM public.visit_events WHERE created_at > now() - interval '7 days'),
    'by_hour', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('hour', h.hour, 'count', coalesce(v.c, 0)) ORDER BY h.hour), '[]'::jsonb)
      FROM generate_series(date_trunc('hour', now()) - make_interval(hours => _h - 1), date_trunc('hour', now()), interval '1 hour') AS h(hour)
      LEFT JOIN (
        SELECT date_trunc('hour', created_at) AS hour, count(*) AS c
        FROM public.visit_events
        WHERE created_at > now() - make_interval(hours => _h)
        GROUP BY 1
      ) v ON v.hour = h.hour
    ),
    'by_country', (
      SELECT coalesce(jsonb_agg(x ORDER BY (x->>'count')::bigint DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('country', coalesce(country, 'XX'), 'count', count(*)) AS x
        FROM public.visit_events
        GROUP BY coalesce(country, 'XX')
        ORDER BY count(*) DESC
        LIMIT 30
      ) s
    )
  ) INTO _res;

  RETURN _res;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_visit_stats(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_visit_stats(integer) TO authenticated, service_role;