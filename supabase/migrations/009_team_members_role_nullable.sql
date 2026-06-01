-- Relaxes NOT NULL on `role` (member display name). This does NOT remove the column.
-- If you need the column back after it was dropped, run 010_team_members_ensure_role_column.sql too.
ALTER TABLE team_members ALTER COLUMN role DROP NOT NULL;
