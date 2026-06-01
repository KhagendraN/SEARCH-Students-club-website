import { supabase } from './supabase-config.js';

/**
 * Fetch all projects, ordered by pinned status then creation date
 * @returns {Promise<Array>} - List of projects
 */
export async function fetchProjects() {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }

    return data;
}
