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