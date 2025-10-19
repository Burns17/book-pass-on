-- Fix infinite recursion in profiles RLS policy
-- First, drop the problematic policy
DROP POLICY IF EXISTS "Profiles viewable by same school users" ON public.profiles;

-- Create a security definer function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Profiles viewable by same school users"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    id = auth.uid() 
    OR school_id = public.get_user_school_id(auth.uid())
  )
);