// Supabase configuration — replace the placeholder values below with your real
// project URL and anon key from https://app.supabase.com/project/_/settings/api
//
// These are PUBLIC credentials (safe to commit). Row Level Security policies
// in Supabase enforce write permissions server-side — never put the service_role
// key here.

export const SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
};

export const SUPABASE_ENABLED =
  !SUPABASE_CONFIG.url.includes('YOUR-PROJECT') &&
  !SUPABASE_CONFIG.anonKey.includes('YOUR_');

export const REVIEWS_TABLE = 'reviews';
