-- Update handle_new_user function to auto-populate student information from registry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  email_domain text;
  matched_school_id uuid;
  registry_first_name text;
  registry_last_name text;
BEGIN
  -- Extract domain from email
  email_domain := split_part(new.email, '@', 2);
  
  -- Find matching school by domain
  SELECT id INTO matched_school_id
  FROM public.schools
  WHERE domain = email_domain
  LIMIT 1;
  
  -- Look up student information from registry
  SELECT first_name, last_name INTO registry_first_name, registry_last_name
  FROM public.student_registry
  WHERE student_email_address = new.email
  AND is_active = true
  LIMIT 1;
  
  -- Insert profile with auto-populated information from registry
  INSERT INTO public.profiles (id, first_name, last_name, email, school_id)
  VALUES (
    new.id,
    COALESCE(registry_first_name, new.raw_user_meta_data->>'first_name', 'Student'),
    COALESCE(registry_last_name, new.raw_user_meta_data->>'last_name', 'User'),
    new.email,
    matched_school_id
  );
  
  -- Assign default 'student' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$function$;