import { createClient } from '@supabase/supabase-js';

// Get saved Supabase URL & Key from localStorage or defaults
export const getSupabaseConfig = () => {
  try {
    const url = localStorage.getItem('supabase_url') || '';
    const key = localStorage.getItem('supabase_anon_key') || '';
    return { url: url.trim(), key: key.trim() };
  } catch (e) {
    return { url: '', key: '' };
  }
};

export const setSupabaseConfig = (url, key) => {
  try {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', key.trim());
  } catch (e) {}
};

let cachedClient = null;
let cachedUrl = '';
let cachedKey = '';

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!cachedClient || cachedUrl !== url || cachedKey !== key) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false }
    });
    cachedUrl = url;
    cachedKey = key;
  }
  return cachedClient;
};
