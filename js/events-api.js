import { supabase } from './supabase-config.js';

/**
 * Fetch all events, ordered by pinned status then creation date
 * @returns {Promise<Array>} - List of events
 */
export async function fetchEvents() {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }

    return data;
}
