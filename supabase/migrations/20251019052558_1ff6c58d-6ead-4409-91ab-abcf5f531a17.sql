-- Drop the existing check constraint on requests.status
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Add the correct check constraint allowing all status values
ALTER TABLE public.requests 
ADD CONSTRAINT requests_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));