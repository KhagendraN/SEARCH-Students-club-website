-- Resources table for links (Google Drive, etc.)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  drive_url TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_pinned ON resources(is_pinned);
CREATE INDEX IF NOT EXISTS idx_resources_order ON resources(display_order, created_at DESC);

-- Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public can read all resources
CREATE POLICY "Public can view resources"
  ON resources FOR SELECT
  USING (true);

-- Authenticated users can manage resources
CREATE POLICY "Authenticated users can insert resources"
  ON resources FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update resources"
  ON resources FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete resources"
  ON resources FOR DELETE
  USING (auth.role() = 'authenticated');
