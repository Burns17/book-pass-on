-- Drop the restrictive RLS policy that blocks unauthenticated access
DROP POLICY IF EXISTS "Users can view active students in registry" ON public.student_registry;

-- Create a new policy that allows anyone to read active students (needed for signup verification)
CREATE POLICY "Anyone can view active students for verification"
ON public.student_registry
FOR SELECT
USING (is_active = true);

-- Keep the admin policy for full management
-- (Already exists from previous migration)