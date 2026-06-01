import { supabase } from './supabase-config.js';

/**
 * Fetch all team_members from Supabase
 * @returns {Promise<Array>} Array of experience objects
 */
export async function fetchTeamMembers() {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching team_members:', error);
            throw error;
        }

        return data || [];
    } catch (err) {
        console.error('Failed to fetch team_members:', err);
        return [];
    }
}
