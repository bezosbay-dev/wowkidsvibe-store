// Supabase JS client — loaded from CDN (esm.sh) so we don't need a bundler.
// Used for auth (admin login) and for authenticated CRUD calls in the admin
// panel. Public reads still go through the lightweight REST helpers in
// reviews.js / product-videos.js / etc. so storefront pages don't pay the
// SDK download cost.

import { SUPABASE_CONFIG, SUPABASE_ENABLED } from '../supabase-config.js';

let _client = null;
let _loadPromise = null;

async function loadSdk() {
  if (_loadPromise) return _loadPromise;
  _loadPromise = import('https://esm.sh/@supabase/supabase-js@2.45.4');
  return _loadPromise;
}

export async function getSupabase() {
  if (_client) return _client;
  if (!SUPABASE_ENABLED) {
    throw new Error('Supabase is not configured. Fill in js/supabase-config.js');
  }
  const { createClient } = await loadSdk();
  _client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'wkv_admin_auth',
    },
  });
  return _client;
}

// Convenience wrapper: fetch with current admin JWT (or anon key) so plain
// REST calls bypassing the SDK still respect RLS as the logged-in user.
export async function adminHeaders() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || SUPABASE_CONFIG.anonKey;
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${token}`,
  };
}

export function restUrl(path) {
  return `${SUPABASE_CONFIG.url}/rest/v1/${path}`;
}
