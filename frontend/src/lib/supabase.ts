import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. ' +
    'Auth will not work. Add them to frontend/.env'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

/**
 * Returns the best URL to use for redirects.
 * Checks VITE_SITE_URL, VITE_VERCEL_URL, and falls back to window.location.origin.
 */
export const getURL = () => {
  let url = window.location.origin;
    
  // Make sure to include `http://` or `https://`
  url = url.includes('http') ? url : `https://${url}`;
  // Remove trailing slash if present, so we can cleanly append routes
  url = url.replace(/\/$/, '');
  
  return url;
};
