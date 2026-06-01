import { supabase } from './supabase-config.js';

export async function fetchProfile() {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('profile')
        .select('*')
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}
