// Supabase configuration — replace the placeholder values below with your real
// project URL and anon key from https://app.supabase.com/project/_/settings/api
//
// These are PUBLIC credentials (safe to commit). Row Level Security policies
// in Supabase enforce write permissions server-side — never put the service_role
// key here.

export const SUPABASE_CONFIG = {
  url: 'https://qxjkeuyerbkjcrxakquz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4amtldXllcmJramNyeGFrcXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzY3ODYsImV4cCI6MjA5MTQxMjc4Nn0.R0skLONrv_sSYaLe38EbgEwrMO97uMXHRKAPwGIKgf0',
};

export const SUPABASE_ENABLED =
  !SUPABASE_CONFIG.url.includes('YOUR-PROJECT') &&
  !SUPABASE_CONFIG.anonKey.includes('YOUR_');

// Single admin allowlist — must match the email used in supabase/setup.sql
// RLS policies. Used client-side by admin-auth.js to gate the dashboard;
// real enforcement is the RLS policy on the server.
export const ADMIN_EMAIL = 'bezosbay@gmail.com';

// Table names
export const REVIEWS_TABLE          = 'reviews';
export const PRODUCT_VIDEOS_TABLE   = 'product_videos';
export const FEATURED_TABLE         = 'featured_products';
export const SITE_SETTINGS_TABLE    = 'site_settings';
