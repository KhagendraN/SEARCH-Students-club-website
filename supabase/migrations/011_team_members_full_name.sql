-- Separate member identity from role/title: "Khagendra Neupane" vs "Vice President"
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS full_name TEXT;

COMMENT ON COLUMN team_members.full_name IS 'Member full legal/display name.';
COMMENT ON COLUMN team_members.role IS 'Position or title (e.g. Vice President, Lead Developer).';
