-- Let authenticated admins manage all team member rows from the admin panel.
-- This avoids ownership-based failures on legacy rows that may not have a usable author_id.

DROP POLICY IF EXISTS "Users can insert their own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can update their own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can delete their own team_members" ON team_members;

DROP POLICY IF EXISTS "Authenticated users can insert team_members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can update team_members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can delete team_members" ON team_members;

CREATE POLICY "Authenticated users can insert team_members"
  ON team_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update team_members"
  ON team_members FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete team_members"
  ON team_members FOR DELETE
  USING (auth.role() = 'authenticated');
