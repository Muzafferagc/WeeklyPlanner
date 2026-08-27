import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = "https://kpyumuujjehptxplalhp.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweXVtdXVqamVocHR4cGxhbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODUxNTAsImV4cCI6MjEwMzM2MTE1MH0.coq2OZizMS2H170WWbC4AfLXKDrvfM8YbWovleB5Xas";

export const getSupabaseConfig = () => {
  try {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_anon_key');
    
    const cleanUrl = (url && url.trim() && url.trim().length > 10) ? url.trim() : DEFAULT_SUPABASE_URL;
    const cleanKey = (key && key.trim() && key.trim().length > 20) ? key.trim() : DEFAULT_SUPABASE_KEY;
    
    return { url: cleanUrl, key: cleanKey };
  } catch (e) {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY };
  }
};

export const setSupabaseConfig = (url, key) => {
  try {
    if (url && url.trim()) localStorage.setItem('supabase_url', url.trim());
    else localStorage.removeItem('supabase_url');

    if (key && key.trim()) localStorage.setItem('supabase_anon_key', key.trim());
    else localStorage.removeItem('supabase_anon_key');
  } catch (e) {}
};

let cachedClient = null;
let cachedUrl = '';
let cachedKey = '';

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();

  if (!cachedClient || cachedUrl !== url || cachedKey !== key) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false }
    });
    cachedUrl = url;
    cachedKey = key;
  }
  return cachedClient;
};
