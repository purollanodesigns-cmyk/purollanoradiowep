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