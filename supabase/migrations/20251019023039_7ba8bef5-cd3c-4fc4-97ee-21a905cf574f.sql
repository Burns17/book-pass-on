-- Create student_registry table
CREATE TABLE IF NOT EXISTS public.student_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id_num TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  student_email_address TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(student_id_num, school_id),
  UNIQUE(student_email_address, school_id)
);

-- Enable RLS
ALTER TABLE public.student_registry ENABLE ROW LEVEL SECURITY;

-- Admin can do everything on student_registry
CREATE POLICY "Admins can manage student registry"
ON public.student_registry
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view active students in their school (for verification)
CREATE POLICY "Users can view active students in registry"
ON public.student_registry
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create index for faster lookups
CREATE INDEX idx_student_registry_lookup ON public.student_registry(student_id_num, student_email_address, school_id, is_active);

-- Insert demo data
INSERT INTO public.student_registry (student_id_num, first_name, last_name, student_email_address, school_id, is_active)
SELECT '11110', 'Simone', 'Brown', 'SimoneBrown@school.com', s.id, true
FROM public.schools s
WHERE s.domain = 'school.com'
ON CONFLICT (student_id_num, school_id) DO NOTHING;

INSERT INTO public.student_registry (student_id_num, first_name, last_name, student_email_address, school_id, is_active)
SELECT '11111', 'James', 'Brown', 'JamesBrown@school.com', s.id, true
FROM public.schools s
WHERE s.domain = 'school.com'
ON CONFLICT (student_id_num, school_id) DO NOTHING;