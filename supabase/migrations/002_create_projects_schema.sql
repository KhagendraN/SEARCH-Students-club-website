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
