-- Add About section fields to profile table
ALTER TABLE profile 
ADD COLUMN IF NOT EXISTS about_image_url TEXT,
ADD COLUMN IF NOT EXISTS about_subtitle TEXT,
ADD COLUMN IF NOT EXISTS about_text TEXT;

-- Backfill nulls only (no bundled default images or personal copy)
UPDATE profile
SET
  about_image_url = COALESCE(about_image_url, ''),
  about_subtitle = COALESCE(about_subtitle, ''),
  about_text = COALESCE(about_text, '')
WHERE id IS NOT NULL;
