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