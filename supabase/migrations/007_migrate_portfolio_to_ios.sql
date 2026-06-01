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
CREATE POLICY "Users can insert their own team_members" ON team_members FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own team_members" ON team_members FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own team_members" ON team_members FOR DELETE USING (auth.uid() = author_id);
