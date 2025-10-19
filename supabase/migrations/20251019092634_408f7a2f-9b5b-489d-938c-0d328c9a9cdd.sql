-- Allow admins to view all requests
CREATE POLICY "Admins can view all requests"
ON public.requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all textbooks
CREATE POLICY "Admins can view all textbooks"
ON public.textbooks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));