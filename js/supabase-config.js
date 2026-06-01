// Configuration (UMD global from https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 — load that script before any module that imports this file)
const SUPABASE_URL = window.SUPABASE_URL || 'https://wwrriugkeshttmzwtgbe.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cnJpdWdrZXNodHRtend0Z2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTU0ODQsImV4cCI6MjA5NTgzMTQ4NH0.UvrgE80nRJhIvcGZvmx5LkRCcHpEiaEPG9fdG5d5sBw';

let supabase = null;
try {
    const g = window.supabase;
    if (g && typeof g.createClient === 'function') {
        supabase = g.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error('Supabase client init failed:', e);
}

export { supabase };
