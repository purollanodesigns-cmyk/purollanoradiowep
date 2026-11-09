
-- =========================================================
-- COMMENTS TABLE
-- =========================================================
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message text NOT NULL,
  likes int NOT NULL DEFAULT 0,
  reports int NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  client_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_created_idx ON public.comments (created_at DESC);
CREATE INDEX comments_client_idx ON public.comments (client_id, created_at DESC);

GRANT SELECT ON public.comments TO anon, authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Public may only read approved (non-hidden, low-report) comments
CREATE POLICY "public read visible comments"
  ON public.comments FOR SELECT
  TO anon, authenticated
  USING (is_hidden = false AND reports < 3);

-- No direct inserts/updates/deletes — must go through security-definer RPCs

-- =========================================================
-- SITE VISITS COUNTER
-- =========================================================
CREATE TABLE public.site_visits (
  id int PRIMARY KEY DEFAULT 1,
  total bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_visits_singleton CHECK (id = 1)
);

INSERT INTO public.site_visits (id, total) VALUES (1, 0);

GRANT SELECT ON public.site_visits TO anon, authenticated;
GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read visits"
  ON public.site_visits FOR SELECT
  TO anon, authenticated
  USING (true);

-- =========================================================
-- SPAM / BANNED WORDS
-- =========================================================
CREATE OR REPLACE FUNCTION public._is_spam(_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  lower_t text := lower(_text);
  banned text[] := ARRAY[
    'viagra', 'casino', 'porn', 'xxx', 'sex ', 'crypto pump',
    'bitcoin gift', 'onlyfans', 'telegram.me', 't.me/', 'wa.me/',
    'http://', 'https://', 'www.', '.ru/', '.xyz/', 'cialis'
  ];
  w text;
  urls int;
BEGIN
  FOREACH w IN ARRAY banned LOOP
    IF position(w in lower_t) > 0 THEN RETURN true; END IF;
  END LOOP;
  -- repeated char spam ("aaaaaaaaaa")
  IF _text ~ '(.)\1{9,}' THEN RETURN true; END IF;
  -- all caps and long
  IF length(_text) > 30 AND _text = upper(_text) AND _text ~ '[A-Z]' THEN RETURN true; END IF;
  RETURN false;
END;
$$;

-- =========================================================
-- POST COMMENT (rate-limited, honeypot, validates length)
-- =========================================================
CREATE OR REPLACE FUNCTION public.post_comment(
  _name text,
  _message text,
  _client_id text,
  _honeypot text DEFAULT ''
)
RETURNS TABLE (id uuid, name text, message text, likes int, reports int, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_name text := btrim(_name);
  clean_msg  text := btrim(_message);
  recent_count int;
  new_id uuid;
  hide boolean := false;
BEGIN
  -- honeypot: bots fill this hidden field
  IF _honeypot IS NOT NULL AND length(_honeypot) > 0 THEN
    RAISE EXCEPTION 'spam_detected';
  END IF;

  IF clean_name IS NULL OR length(clean_name) < 2 OR length(clean_name) > 40 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF clean_msg IS NULL OR length(clean_msg) < 3 OR length(clean_msg) > 500 THEN
    RAISE EXCEPTION 'invalid_message';
  END IF;
  IF _client_id IS NULL OR length(_client_id) < 8 THEN
    RAISE EXCEPTION 'invalid_client';
  END IF;

  -- rate limit: 1 comment / 20s and max 10 / hour per client
  SELECT count(*) INTO recent_count
    FROM public.comments
    WHERE client_id = _client_id AND created_at > now() - interval '20 seconds';
  IF recent_count > 0 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  SELECT count(*) INTO recent_count
    FROM public.comments
    WHERE client_id = _client_id AND created_at > now() - interval '1 hour';
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'hourly_limit';
  END IF;

  -- auto-moderation
  IF public._is_spam(clean_msg) OR public._is_spam(clean_name) THEN
    hide := true;
  END IF;

  INSERT INTO public.comments (name, message, client_id, is_hidden)
    VALUES (clean_name, clean_msg, _client_id, hide)
    RETURNING comments.id INTO new_id;

  RETURN QUERY
    SELECT c.id, c.name, c.message, c.likes, c.reports, c.created_at
      FROM public.comments c WHERE c.id = new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.post_comment(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_comment(text, text, text, text) TO anon, authenticated;

-- =========================================================
-- LIKE (idempotent-ish: toggles via client not tracked here)
-- =========================================================
CREATE OR REPLACE FUNCTION public.toggle_like_comment(_id uuid, _delta int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_val int;
BEGIN
  IF _delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'invalid_delta';
  END IF;
  UPDATE public.comments
    SET likes = GREATEST(0, likes + _delta)
    WHERE id = _id AND is_hidden = false
    RETURNING likes INTO new_val;
  RETURN new_val;
END;
$$;
REVOKE ALL ON FUNCTION public.toggle_like_comment(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_like_comment(uuid, int) TO anon, authenticated;

-- =========================================================
-- REPORT
-- =========================================================
CREATE OR REPLACE FUNCTION public.report_comment(_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_val int;
BEGIN
  UPDATE public.comments
    SET reports = reports + 1
    WHERE id = _id
    RETURNING reports INTO new_val;
  RETURN new_val;
END;
$$;
REVOKE ALL ON FUNCTION public.report_comment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.report_comment(uuid) TO anon, authenticated;

-- =========================================================
-- VISITS COUNTER
-- =========================================================
CREATE OR REPLACE FUNCTION public.increment_visits()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_val bigint;
BEGIN
  UPDATE public.site_visits
    SET total = total + 1, updated_at = now()
    WHERE id = 1
    RETURNING total INTO new_val;
  RETURN new_val;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_visits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_visits() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_visits()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT total FROM public.site_visits WHERE id = 1;
$$;
REVOKE ALL ON FUNCTION public.get_visits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_visits() TO anon, authenticated;

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
