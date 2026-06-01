-- Clarification: migration 009 only runs `ALTER COLUMN role DROP NOT NULL`.
-- That does NOT drop the column. If `role` is missing (e.g. removed manually),
-- recreate it so the admin "Name of member" field and API can persist again.

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role TEXT;

COMMENT ON COLUMN team_members.role IS 'Member display name (site + admin "Name of member").';
