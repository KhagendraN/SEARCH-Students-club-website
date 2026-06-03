import { supabase } from './supabase-config.js';

/**
 * Fetch all gallery items, ordered by pinned status, display order, then newest
 * @returns {Promise<Array>} - List of gallery items
 */
export async function fetchGalleryItems() {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching gallery items:', error);
        return [];
    }

    return data || [];
}
