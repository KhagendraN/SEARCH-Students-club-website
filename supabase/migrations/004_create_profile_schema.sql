-- Create profile table
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_image_url TEXT,
  cv_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profile FOR SELECT 
USING (true);

CREATE POLICY "Users can update profile" 
ON profile FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert profile" 
ON profile FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create storage bucket for portfolio assets if it doesn't exist
-- Note: This usually needs to be done in the dashboard, but we can try to insert into storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-assets', 'portfolio-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolio-assets' );

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'portfolio-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'portfolio-assets' AND auth.role() = 'authenticated' );
