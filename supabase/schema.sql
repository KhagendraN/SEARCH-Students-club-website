-- Consolidated schema/migration script
-- Source migrations are included in order so this file can be run once in SQL editor.

-- 001_create_blog_schema.sql
-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  genre TEXT CHECK (genre IN ('tech', 'tutorial', 'lifestyle', 'news', 'personal')),
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT false,
  read_time TEXT,
  tags TEXT[],
  author_id UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_genre ON blog_posts(genre) WHERE is_published = true;

-- Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can view published posts"
  ON blog_posts FOR SELECT
  USING (is_published = true);

-- Authenticated users can manage their posts
CREATE POLICY "Users can insert their own posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON blog_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- 002_create_projects_schema.sql
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  github_url TEXT,
  demo_url TEXT,
  tech_stack TEXT[], -- Array of strings e.g. ["Python", "Networking"]
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_pinned ON projects(is_pinned);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public can read all projects
CREATE POLICY "Public can view projects"
  ON projects FOR SELECT
  USING (true);

-- Authenticated users can manage their projects
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = author_id);

-- 003_create_experiences_schema.sql
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

-- 004_create_profile_schema.sql
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

-- 005_add_about_to_profile.sql
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

-- 006_create_achievements_schema.sql
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

-- 007_migrate_portfolio_to_search.sql
-- Migrate achievements to events
ALTER TABLE IF EXISTS achievements RENAME TO events;
ALTER TABLE IF EXISTS events RENAME COLUMN date_received TO event_date;
ALTER TABLE IF EXISTS events RENAME COLUMN issuer TO location;

ALTER INDEX IF EXISTS idx_achievements_pinned RENAME TO idx_events_pinned;
ALTER INDEX IF EXISTS idx_achievements_created RENAME TO idx_events_created;

DROP POLICY IF EXISTS "Public can view achievements" ON events;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON events;
DROP POLICY IF EXISTS "Users can update their own achievements" ON events;
DROP POLICY IF EXISTS "Users can delete their own achievements" ON events;

CREATE POLICY "Public can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Users can insert their own events" ON events FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own events" ON events FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own events" ON events FOR DELETE USING (auth.uid() = author_id);


-- Migrate experiences to team_members
ALTER TABLE IF EXISTS experiences RENAME TO team_members;
ALTER TABLE IF EXISTS team_members DROP CONSTRAINT IF EXISTS experiences_type_check;

ALTER TABLE IF EXISTS team_members RENAME COLUMN type TO member_group;
ALTER TABLE IF EXISTS team_members RENAME COLUMN date_range TO tenure;

ALTER INDEX IF EXISTS idx_experiences_type RENAME TO idx_team_members_group;
ALTER INDEX IF EXISTS idx_experiences_order RENAME TO idx_team_members_order;

DROP POLICY IF EXISTS "Public can view experiences" ON team_members;
DROP POLICY IF EXISTS "Users can insert their own experiences" ON team_members;
DROP POLICY IF EXISTS "Users can update their own experiences" ON team_members;
DROP POLICY IF EXISTS "Users can delete their own experiences" ON team_members;

CREATE POLICY "Public can view team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert team_members" ON team_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update team_members" ON team_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete team_members" ON team_members FOR DELETE USING (auth.role() = 'authenticated');

-- 008_team_members_image.sql
-- Optional profile photo URL for team members (public site + admin upload)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN team_members.image_url IS 'Public URL for member photo (Supabase Storage or external)';

-- 009_team_members_role_nullable.sql
-- Relaxes NOT NULL on `role` (member display name). This does NOT remove the column.
-- If you need the column back after it was dropped, run 010_team_members_ensure_role_column.sql too.
ALTER TABLE team_members ALTER COLUMN role DROP NOT NULL;

-- 010_team_members_ensure_role_column.sql
-- Clarification: migration 009 only runs `ALTER COLUMN role DROP NOT NULL`.
-- That does NOT drop the column. If `role` is missing (e.g. removed manually),
-- recreate it so the admin "Name of member" field and API can persist again.

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role TEXT;

COMMENT ON COLUMN team_members.role IS 'Member display name (site + admin "Name of member").';

-- 011_team_members_full_name.sql
-- Separate member identity from role/title: "Khagendra Neupane" vs "Vice President"
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS full_name TEXT;

COMMENT ON COLUMN team_members.full_name IS 'Member full legal/display name.';
COMMENT ON COLUMN team_members.role IS 'Position or title (e.g. Vice President, Lead Developer).';

-- 012_blog_posts_author_name.sql
-- Display name for blog post writer (shown on public blog; independent of auth.users)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_name TEXT;
