-- Display name for blog post writer (shown on public blog; independent of auth.users)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_name TEXT;
