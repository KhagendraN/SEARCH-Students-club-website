-- Gallery table (photos + videos)
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  caption TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  is_pinned BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id),
  CONSTRAINT gallery_file_size_limit CHECK (
    file_size_bytes IS NULL
    OR (
      (media_type = 'image' AND file_size_bytes <= 512000)
      OR (media_type = 'video' AND file_size_bytes <= 157286400)
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_items_pinned ON gallery_items(is_pinned);
CREATE INDEX IF NOT EXISTS idx_gallery_items_order ON gallery_items(display_order, created_at DESC);

-- Row Level Security
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- Public can read all gallery items
CREATE POLICY "Public can view gallery_items"
  ON gallery_items FOR SELECT
  USING (true);

-- Authenticated users can manage gallery items
CREATE POLICY "Authenticated users can insert gallery_items"
  ON gallery_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update gallery_items"
  ON gallery_items FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete gallery_items"
  ON gallery_items FOR DELETE
  USING (auth.role() = 'authenticated');
