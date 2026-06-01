-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  issuer TEXT,
  date_received DATE,
  image_url TEXT,
  link_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievements_pinned ON achievements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_achievements_created ON achievements(created_at DESC);

-- Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Public can read all achievements
CREATE POLICY "Public can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- Authenticated users can manage their achievements
CREATE POLICY "Users can insert their own achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own achievements"
  ON achievements FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own achievements"
  ON achievements FOR DELETE
  USING (auth.uid() = author_id);
