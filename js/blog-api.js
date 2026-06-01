import { supabase } from './supabase-config.js';

/**
 * Fetch all published blog posts, optionally filtered by genre
 * @param {string} genre - The genre to filter by (optional)
 * @returns {Promise<Array>} - List of blog posts
 */
export async function fetchAllPosts(genre = 'all') {
    if (!supabase) {
        console.warn(
            'Blog: Supabase client missing. Include <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> before your module.'
        );
        return [];
    }
    let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

    if (genre && genre !== 'all') {
        query = query.eq('genre', genre);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching posts:', error);
        return [];
    }

    return data;
}

/**
 * Fetch a single blog post by its slug
 * @param {string} slug - The unique slug of the post
 * @returns {Promise<Object|null>} - The blog post object or null
 */
export async function fetchPostBySlug(slug) {
    if (!supabase) {
        console.warn('Blog: Supabase client missing (see fetchAllPosts warning).');
        return null;
    }
    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (error) {
        console.error(`Error fetching post with slug "${slug}":`, error);
        return null;
    }

    return data;
}

/**
 * Search blog posts by title or content
 * @param {string} searchQuery - The search term
 * @returns {Promise<Array>} - List of matching blog posts
 */
export async function searchPosts(searchQuery) {
    if (!searchQuery) return [];
    if (!supabase) {
        console.warn('Blog: Supabase client missing (see fetchAllPosts warning).');
        return [];
    }

    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .or(
            `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,author_name.ilike.%${searchQuery}%`
        )
        .order('published_at', { ascending: false });

    if (error) {
        console.error('Error searching posts:', error);
        return [];
    }

    return data;
}
