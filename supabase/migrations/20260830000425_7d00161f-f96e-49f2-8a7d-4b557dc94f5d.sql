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