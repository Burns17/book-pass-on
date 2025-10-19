-- First, drop the duplicate policies we may have created
DROP POLICY IF EXISTS "Admins can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can view all textbooks" ON public.textbooks;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Now create them properly if they don't exist
DO $$ 
BEGIN
  -- Check and create policy for requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'requests' 
    AND policyname = 'Admins can view all requests'
  ) THEN
    CREATE POLICY "Admins can view all requests"
    ON public.requests
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- Check and create policy for textbooks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'textbooks' 
    AND policyname = 'Admins can view all textbooks'
  ) THEN
    CREATE POLICY "Admins can view all textbooks"
    ON public.textbooks
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- Check and create policy for profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;