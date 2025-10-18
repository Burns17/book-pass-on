-- Fix Critical Security Issues

-- 1. Create user_roles table with proper enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS for user_roles: users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles (will be enforced via edge functions)
-- No INSERT/UPDATE/DELETE policies for regular users

-- 2. Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Drop the role column from profiles (migration data first)
-- Migrate existing roles to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop the role column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 4. Make school_id NOT NULL in profiles (it should always be set)
-- First, ensure all profiles have a school_id (set to first school if null)
UPDATE public.profiles
SET school_id = (SELECT id FROM public.schools LIMIT 1)
WHERE school_id IS NULL;

ALTER TABLE public.profiles ALTER COLUMN school_id SET NOT NULL;

-- 5. Update profiles RLS policy to restrict to same school
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles viewable by same school users" ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (id = auth.uid() OR school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()))
  );

-- 6. Update locations RLS policy to restrict to same school
DROP POLICY IF EXISTS "Locations viewable by authenticated users" ON public.locations;

CREATE POLICY "Locations viewable by same school users" ON public.locations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

-- 7. Add admin/moderator access to reports
CREATE POLICY "Admins and moderators can view all reports" ON public.reports
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "Admins and moderators can update reports" ON public.reports
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
  );

-- 8. Add input validation constraints
ALTER TABLE public.textbooks ADD CONSTRAINT title_length CHECK (length(title) > 0 AND length(title) <= 200);
ALTER TABLE public.textbooks ADD CONSTRAINT author_length CHECK (author IS NULL OR length(author) <= 100);
ALTER TABLE public.textbooks ADD CONSTRAINT isbn_length CHECK (isbn IS NULL OR length(isbn) <= 17);
ALTER TABLE public.textbooks ADD CONSTRAINT edition_length CHECK (edition IS NULL OR length(edition) <= 50);

ALTER TABLE public.messages ADD CONSTRAINT body_length CHECK (length(body) > 0 AND length(body) <= 1000);
ALTER TABLE public.reports ADD CONSTRAINT reason_length CHECK (length(reason) > 0 AND length(reason) <= 500);

ALTER TABLE public.profiles ADD CONSTRAINT first_name_length CHECK (length(first_name) > 0 AND length(first_name) <= 100);
ALTER TABLE public.profiles ADD CONSTRAINT last_name_length CHECK (length(last_name) > 0 AND length(last_name) <= 100);

-- 9. Fix storage policies for ownership validation
DROP POLICY IF EXISTS "Users can update their own textbook photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own textbook photos" ON storage.objects;

CREATE POLICY "Users can upload their own textbook photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'textbook-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own textbook photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'textbook-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own textbook photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'textbook-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 10. Update handle_new_user function to auto-assign school based on email domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_domain text;
  matched_school_id uuid;
BEGIN
  -- Extract domain from email
  email_domain := split_part(new.email, '@', 2);
  
  -- Find matching school by domain
  SELECT id INTO matched_school_id
  FROM public.schools
  WHERE domain = email_domain
  LIMIT 1;
  
  -- Insert profile with auto-assigned school
  INSERT INTO public.profiles (id, first_name, last_name, email, school_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', 'Student'),
    COALESCE(new.raw_user_meta_data->>'last_name', 'User'),
    new.email,
    matched_school_id
  );
  
  -- Assign default 'student' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;