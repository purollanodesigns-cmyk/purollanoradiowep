
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
CREATE OR REPLACE FUNCTION public.post_comment(_name text, _message text, _client_id text, _honeypot text DEFAULT ''::text)
 RETURNS TABLE(id uuid, name text, message text, likes integer, reports integer, created_at timestamp with time zone)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  clean_name text := btrim(_name);
  clean_msg  text := btrim(_message);
  recent_count int;
  new_id uuid;
  hide boolean := false;
BEGIN
  IF _honeypot IS NOT NULL AND length(_honeypot) > 0 THEN RAISE EXCEPTION 'spam_detected'; END IF;
  IF clean_name IS NULL OR length(clean_name) < 2 OR length(clean_name) > 40 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  IF clean_msg IS NULL OR length(clean_msg) < 3 OR length(clean_msg) > 500 THEN RAISE EXCEPTION 'invalid_message'; END IF;
  IF _client_id IS NULL OR length(_client_id) < 8 THEN RAISE EXCEPTION 'invalid_client'; END IF;

  SELECT count(*) INTO recent_count FROM public.comments c
    WHERE c.client_id = _client_id AND c.created_at > now() - interval '20 seconds';
  IF recent_count > 0 THEN RAISE EXCEPTION 'rate_limited'; END IF;

  SELECT count(*) INTO recent_count FROM public.comments c
    WHERE c.client_id = _client_id AND c.created_at > now() - interval '1 hour';
  IF recent_count >= 10 THEN RAISE EXCEPTION 'hourly_limit'; END IF;

  IF public._is_spam(clean_msg) OR public._is_spam(clean_name) THEN hide := true; END IF;

  INSERT INTO public.comments (name, message, client_id, is_hidden)
    VALUES (clean_name, clean_msg, _client_id, hide)
    RETURNING comments.id INTO new_id;

  RETURN QUERY
    SELECT c.id, c.name, c.message, c.likes, c.reports, c.created_at
      FROM public.comments c WHERE c.id = new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_comments(_token text)
 RETURNS TABLE(id uuid, name text, message text, likes integer, reports integer, is_hidden boolean, client_id text, created_at timestamp with time zone)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF _token IS NULL OR _token <> 'llano-admin-2026-x7k9m' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT c.id, c.name, c.message, c.likes, c.reports, c.is_hidden, c.client_id, c.created_at
      FROM public.comments c ORDER BY c.created_at DESC LIMIT 500;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_moderate_comment(_token text, _id uuid, _action text)
 RETURNS boolean
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF _token IS NULL OR _token <> 'llano-admin-2026-x7k9m' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF _action = 'hide' THEN
    UPDATE public.comments SET is_hidden = true WHERE id = _id;
  ELSIF _action = 'unhide' THEN
    UPDATE public.comments SET is_hidden = false, reports = 0 WHERE id = _id;
  ELSIF _action = 'clear_reports' THEN
    UPDATE public.comments SET reports = 0 WHERE id = _id;
  ELSIF _action = 'delete' THEN
    DELETE FROM public.comments WHERE id = _id;
  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_comments(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_comment(text, uuid, text) TO anon, authenticated;
CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  lang text,
  is_active boolean NOT NULL DEFAULT true,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_tokens TO service_role;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.push_state (
  id integer PRIMARY KEY DEFAULT 1,
  last_song text,
  last_sent_at timestamptz,
  CONSTRAINT push_state_single CHECK (id = 1)
);
INSERT INTO public.push_state (id, last_song) VALUES (1, NULL);
GRANT ALL ON public.push_state TO service_role;
ALTER TABLE public.push_state ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.register_push_token(_token text, _platform text DEFAULT 'web', _lang text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _token IS NULL OR length(_token) < 20 OR length(_token) > 500 THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;
  INSERT INTO public.push_tokens (token, platform, lang)
    VALUES (_token, coalesce(nullif(btrim(_platform), ''), 'web'), _lang)
  ON CONFLICT (token) DO UPDATE
    SET is_active = true, last_seen = now(), lang = COALESCE(EXCLUDED.lang, public.push_tokens.lang);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.unregister_push_token(_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.push_tokens SET is_active = false WHERE token = _token;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_push_token(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unregister_push_token(text) TO anon, authenticated;
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
CREATE OR REPLACE FUNCTION public.admin_list_comments(_token text)
 RETURNS TABLE(id uuid, name text, message text, likes integer, reports integer, is_hidden boolean, client_id text, created_at timestamp with time zone)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF _token IS NULL OR _token <> 'Mi-campo.123' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT c.id, c.name, c.message, c.likes, c.reports, c.is_hidden, c.client_id, c.created_at
      FROM public.comments c ORDER BY c.created_at DESC LIMIT 500;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_moderate_comment(_token text, _id uuid, _action text)
 RETURNS boolean
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF _token IS NULL OR _token <> 'Mi-campo.123' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF _action = 'hide' THEN
    UPDATE public.comments SET is_hidden = true WHERE id = _id;
  ELSIF _action = 'unhide' THEN
    UPDATE public.comments SET is_hidden = false, reports = 0 WHERE id = _id;
  ELSIF _action = 'clear_reports' THEN
    UPDATE public.comments SET reports = 0 WHERE id = _id;
  ELSIF _action = 'delete' THEN
    DELETE FROM public.comments WHERE id = _id;
  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;
  RETURN true;
END;
$function$;
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

DROP POLICY IF EXISTS "public read announcements" ON public.announcements;
CREATE POLICY "public read published announcements"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements (created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_create_announcement(
  _token text,
  _title text,
  _body text,
  _image_url text DEFAULT NULL,
  _path text DEFAULT '/'
)
RETURNS TABLE(id uuid, title text, body text, image_url text, path text, is_published boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF _token IS NULL OR _token <> 'Mi-campo.123' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF btrim(coalesce(_title,'')) = '' OR length(btrim(_title)) > 120 THEN
    RAISE EXCEPTION 'invalid_title';
  END IF;
  IF btrim(coalesce(_body,'')) = '' OR length(btrim(_body)) > 1000 THEN
    RAISE EXCEPTION 'invalid_body';
  END IF;

  INSERT INTO public.announcements (title, body, image_url, path)
  VALUES (
    btrim(_title),
    btrim(_body),
    nullif(btrim(coalesce(_image_url,'')), ''),
    CASE WHEN _path LIKE '/%' THEN _path ELSE '/' END
  )
  RETURNING announcements.id INTO new_id;

  RETURN QUERY
    SELECT a.id, a.title, a.body, a.image_url, a.path, a.is_published, a.created_at
    FROM public.announcements a WHERE a.id = new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_announcements(_token text)
RETURNS TABLE(id uuid, title text, body text, image_url text, path text, is_published boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _token IS NULL OR _token <> 'Mi-campo.123' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT a.id, a.title, a.body, a.image_url, a.path, a.is_published, a.created_at
    FROM public.announcements a ORDER BY a.created_at DESC LIMIT 200;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_announcement(_token text, _id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _token IS NULL OR _token <> 'Mi-campo.123' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  DELETE FROM public.announcements WHERE id = _id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_announcement(_token text, _id uuid, _published boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _token IS NULL OR _token <> 'Mi-campo.123' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.announcements SET is_published = _published WHERE id = _id;
  RETURN true;
END;
$$;
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')
$$;

-- POLICIES
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "read own roles or admin" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "admin grants roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin revokes roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());

-- SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  IF lower(NEW.email) = 'purollanoradio@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.profiles (id, email, display_name)
SELECT u.id, u.email, split_part(u.email, '@', 1) FROM auth.users u ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_roles (user_id, role) SELECT u.id, 'user' FROM auth.users u ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role) SELECT u.id, 'admin' FROM auth.users u WHERE lower(u.email) = 'purollanoradio@gmail.com' ON CONFLICT DO NOTHING;

-- ADMIN LISTING OF USERS
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, email text, display_name text, created_at timestamptz, is_admin boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.email, p.display_name, p.created_at,
         public.has_role(p.id, 'admin') AS is_admin
  FROM public.profiles p
  WHERE public.is_admin()
  ORDER BY p.created_at DESC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id uuid, _role public.app_role, _grant boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role) ON CONFLICT DO NOTHING;
  ELSE
    IF _role = 'admin' AND (SELECT count(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'last_admin';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
  RETURN true;
END;
$$;

-- REPLACE TOKEN-BASED ADMIN FUNCTIONS WITH ROLE-BASED ONES
DROP FUNCTION IF EXISTS public.admin_list_comments(text);
DROP FUNCTION IF EXISTS public.admin_moderate_comment(text, uuid, text);
DROP FUNCTION IF EXISTS public.admin_list_announcements(text);
DROP FUNCTION IF EXISTS public.admin_create_announcement(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_toggle_announcement(text, uuid, boolean);
DROP FUNCTION IF EXISTS public.admin_delete_announcement(text, uuid);

CREATE OR REPLACE FUNCTION public.admin_list_comments()
RETURNS TABLE(id uuid, name text, message text, likes integer, reports integer, is_hidden boolean, client_id text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY SELECT c.id, c.name, c.message, c.likes, c.reports, c.is_hidden, c.client_id, c.created_at
    FROM public.comments c ORDER BY c.created_at DESC LIMIT 500;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_moderate_comment(_id uuid, _action text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _action = 'hide' THEN UPDATE public.comments SET is_hidden = true WHERE id = _id;
  ELSIF _action = 'unhide' THEN UPDATE public.comments SET is_hidden = false, reports = 0 WHERE id = _id;
  ELSIF _action = 'clear_reports' THEN UPDATE public.comments SET reports = 0 WHERE id = _id;
  ELSIF _action = 'delete' THEN DELETE FROM public.comments WHERE id = _id;
  ELSE RAISE EXCEPTION 'invalid_action';
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_announcements()
RETURNS TABLE(id uuid, title text, body text, image_url text, path text, is_published boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY SELECT a.id, a.title, a.body, a.image_url, a.path, a.is_published, a.created_at
    FROM public.announcements a ORDER BY a.created_at DESC LIMIT 200;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_announcement(_title text, _body text, _image_url text DEFAULT NULL, _path text DEFAULT '/')
RETURNS TABLE(id uuid, title text, body text, image_url text, path text, is_published boolean, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF btrim(coalesce(_title,'')) = '' OR length(btrim(_title)) > 120 THEN RAISE EXCEPTION 'invalid_title'; END IF;
  IF btrim(coalesce(_body,'')) = '' OR length(btrim(_body)) > 1000 THEN RAISE EXCEPTION 'invalid_body'; END IF;
  INSERT INTO public.announcements (title, body, image_url, path)
  VALUES (btrim(_title), btrim(_body), nullif(btrim(coalesce(_image_url,'')), ''),
          CASE WHEN _path LIKE '/%' THEN _path ELSE '/' END)
  RETURNING announcements.id INTO new_id;
  RETURN QUERY SELECT a.id, a.title, a.body, a.image_url, a.path, a.is_published, a.created_at
    FROM public.announcements a WHERE a.id = new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_announcement(_id uuid, _published boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE public.announcements SET is_published = _published WHERE id = _id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_announcement(_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  DELETE FROM public.announcements WHERE id = _id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, public.app_role, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_comments() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_moderate_comment(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_announcements() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_announcement(text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_announcement(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_announcement(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
CREATE TABLE public.recommended_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.recommended_videos TO anon;
GRANT SELECT ON public.recommended_videos TO authenticated;
GRANT ALL ON public.recommended_videos TO service_role;

ALTER TABLE public.recommended_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published videos" ON public.recommended_videos
  FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE TRIGGER update_recommended_videos_updated_at
  BEFORE UPDATE ON public.recommended_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.admin_list_videos()
RETURNS TABLE(id uuid, youtube_id text, title text, description text, sort_order integer, is_published boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.youtube_id, v.title, v.description, v.sort_order, v.is_published, v.created_at
  FROM public.recommended_videos v
  WHERE public.is_admin()
  ORDER BY v.sort_order ASC, v.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.admin_create_video(_youtube_id text, _title text, _description text DEFAULT NULL, _sort_order integer DEFAULT 0)
RETURNS TABLE(id uuid, youtube_id text, title text, description text, sort_order integer, is_published boolean, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY
  INSERT INTO public.recommended_videos (youtube_id, title, description, sort_order)
  VALUES (trim(_youtube_id), trim(_title), nullif(trim(coalesce(_description,'')),''), coalesce(_sort_order,0))
  RETURNING recommended_videos.id, recommended_videos.youtube_id, recommended_videos.title,
            recommended_videos.description, recommended_videos.sort_order,
            recommended_videos.is_published, recommended_videos.created_at;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_toggle_video(_id uuid, _published boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  UPDATE public.recommended_videos SET is_published = _published WHERE id = _id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_video(_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'unauthorized'; END IF;
  DELETE FROM public.recommended_videos WHERE id = _id;
  RETURN true;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_videos() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_video(text, text, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_video(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_video(uuid) FROM anon;
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
