// Public read for the homepage "trending" curated handles. Returns [] when
// Supabase is not configured or has no rows — caller falls back to a Shopify
// best-sellers query.

import { SUPABASE_CONFIG, SUPABASE_ENABLED, FEATURED_TABLE } from '../supabase-config.js';

function headers() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
  };
}

function url(path) {
  return `${SUPABASE_CONFIG.url}/rest/v1/${path}`;
}

let _cache = null;

export async function getFeaturedHandles() {
  if (!SUPABASE_ENABLED) return [];
  if (_cache) return _cache;

  const q =
    `${FEATURED_TABLE}?status=eq.active` +
    `&order=display_order.asc,created_at.asc` +
    `&select=product_handle,display_order` +
    `&limit=50`;
  try {
    const res = await fetch(url(q), { headers: headers() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rows = await res.json();
    _cache = rows.map(r => r.product_handle).filter(Boolean);
    return _cache;
  } catch (e) {
    console.warn('getFeaturedHandles failed:', e);
    return [];
  }
}
