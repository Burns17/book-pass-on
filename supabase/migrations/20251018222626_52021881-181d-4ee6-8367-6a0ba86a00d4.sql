-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- Create schools table
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  graduation_year integer,
  role text DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create textbooks table
CREATE TABLE public.textbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  author text,
  isbn text,
  edition text,
  condition text CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor')),
  photo_url text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'lent', 'reserved')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create pickup locations table
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  label text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create requests table
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  textbook_id uuid REFERENCES public.textbooks(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  proposed_time timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  from_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('user', 'textbook', 'message')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools (public read)
CREATE POLICY "Schools are viewable by everyone" ON public.schools
  FOR SELECT USING (true);

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for textbooks
CREATE POLICY "Textbooks viewable by same school users" ON public.textbooks
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert own textbooks" ON public.textbooks
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own textbooks" ON public.textbooks
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own textbooks" ON public.textbooks
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for locations
CREATE POLICY "Locations viewable by authenticated users" ON public.locations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for requests
CREATE POLICY "Users can view requests they're involved in" ON public.requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      borrower_id = auth.uid() OR
      textbook_id IN (SELECT id FROM public.textbooks WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create requests" ON public.requests
  FOR INSERT WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Users can update requests they're involved in" ON public.requests
  FOR UPDATE USING (
    auth.uid() = borrower_id OR
    textbook_id IN (SELECT id FROM public.textbooks WHERE owner_id = auth.uid())
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages for their requests" ON public.messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    request_id IN (SELECT id FROM public.requests WHERE 
      borrower_id = auth.uid() OR
      textbook_id IN (SELECT id FROM public.textbooks WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages for their requests" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = from_id AND
    request_id IN (SELECT id FROM public.requests WHERE 
      borrower_id = auth.uid() OR
      textbook_id IN (SELECT id FROM public.textbooks WHERE owner_id = auth.uid())
    )
  );

-- RLS Policies for reports
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Create indexes for performance
CREATE INDEX idx_textbooks_school_id ON public.textbooks(school_id);
CREATE INDEX idx_textbooks_owner_id ON public.textbooks(owner_id);
CREATE INDEX idx_textbooks_status ON public.textbooks(status);
CREATE INDEX idx_textbooks_title_trgm ON public.textbooks USING gin(title gin_trgm_ops);
CREATE INDEX idx_textbooks_isbn ON public.textbooks(isbn);
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX idx_requests_borrower_id ON public.requests(borrower_id);
CREATE INDEX idx_requests_textbook_id ON public.requests(textbook_id);
CREATE INDEX idx_messages_request_id ON public.messages(request_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', 'Student'),
    COALESCE(new.raw_user_meta_data->>'last_name', 'User'),
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for textbook photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('textbook-photos', 'textbook-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for textbook photos
CREATE POLICY "Textbook photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'textbook-photos');

CREATE POLICY "Authenticated users can upload textbook photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'textbook-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own textbook photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'textbook-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own textbook photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'textbook-photos' AND
  auth.uid() IS NOT NULL
);