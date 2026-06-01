-- Optional profile photo URL for team members (public site + admin upload)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN team_members.image_url IS 'Public URL for member photo (Supabase Storage or external)';
