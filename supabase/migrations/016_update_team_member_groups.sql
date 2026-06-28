-- Update team_member groups from legacy values to new structure
-- Legacy 'education' -> 'executive', legacy 'experience' -> 'advisory'
UPDATE team_members SET member_group = 'executive' WHERE member_group = 'education';
UPDATE team_members SET member_group = 'advisory' WHERE member_group = 'experience';
