-- Make school_id nullable in textbooks table to allow users without assigned schools to add textbooks
ALTER TABLE public.textbooks ALTER COLUMN school_id DROP NOT NULL;