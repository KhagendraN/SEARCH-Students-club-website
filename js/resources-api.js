import { supabase } from './supabase-config.js';

/**
 * Fetch all resources, ordered by pinned status, display order, then newest
 * @returns {Promise<Array>} - List of resources
 */
export async function fetchResources() {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching resources:', error);
        return [];
    }

    return data || [];
}
