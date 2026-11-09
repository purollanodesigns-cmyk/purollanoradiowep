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