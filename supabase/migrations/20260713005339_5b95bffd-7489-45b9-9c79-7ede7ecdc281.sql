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