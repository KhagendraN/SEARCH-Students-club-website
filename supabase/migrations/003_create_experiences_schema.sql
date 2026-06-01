-- Experiences table (for both education and work experience)
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('education', 'experience')),
  date_range TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT NOT NULL,
  organization TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiences_type ON experiences(type);
CREATE INDEX IF NOT EXISTS idx_experiences_order ON experiences(display_order, created_at DESC);

-- Row Level Security
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Public can read all experiences
CREATE POLICY "Public can view experiences"
  ON experiences FOR SELECT
  USING (true);

-- Authenticated users can manage their experiences
CREATE POLICY "Users can insert their own experiences"
  ON experiences FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own experiences"
  ON experiences FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own experiences"
  ON experiences FOR DELETE
  USING (auth.uid() = author_id);
