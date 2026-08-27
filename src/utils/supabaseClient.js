import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = "https://kpyumuujjehptxplalhp.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweXVtdXVqamVocHR4cGxhbGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODUxNTAsImV4cCI6MjEwMzM2MTE1MH0.coq2OZizMS2H170WWbC4AfLXKDrvfM8YbWovleB5Xas";

export const getSupabaseConfig = () => {
  try {
    const url = localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;
    const key = localStorage.getItem('supabase_anon_key') || DEFAULT_SUPABASE_KEY;
    return { url: url.trim(), key: key.trim() };
  } catch (e) {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY };
  }
};

export const setSupabaseConfig = (url, key) => {
  try {
    localStorage.setItem('supabase_url', (url || DEFAULT_SUPABASE_URL).trim());
    localStorage.setItem('supabase_anon_key', (key || DEFAULT_SUPABASE_KEY).trim());
  } catch (e) {}
};

let cachedClient = null;
let cachedUrl = '';
let cachedKey = '';

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  const activeUrl = url || DEFAULT_SUPABASE_URL;
  const activeKey = key || DEFAULT_SUPABASE_KEY;

  if (!cachedClient || cachedUrl !== activeUrl || cachedKey !== activeKey) {
    cachedClient = createClient(activeUrl, activeKey, {
      auth: { persistSession: false }
    });
    cachedUrl = activeUrl;
    cachedKey = activeKey;
  }
  return cachedClient;
};
