// Public read for the flash-sale banner row. Falls back to a hardcoded default
// when Supabase isn't configured so the UI keeps working during dev.

import { SUPABASE_CONFIG, SUPABASE_ENABLED, SITE_SETTINGS_TABLE } from '../supabase-config.js';

const DEFAULT_BANNER = {
  text: 'FLASH SALE - 30% OFF EVERYTHING',
  ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  enabled: true,
};

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

export async function getBanner() {
  if (_cache) return _cache;
  if (!SUPABASE_ENABLED) {
    _cache = { ...DEFAULT_BANNER };
    return _cache;
  }
  const q = `${SITE_SETTINGS_TABLE}?key=eq.promo_banner&select=value&limit=1`;
  try {
    const res = await fetch(url(q), { headers: headers() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0] && rows[0].value) {
      _cache = { ...DEFAULT_BANNER, ...rows[0].value };
    } else {
      _cache = { ...DEFAULT_BANNER };
    }
    return _cache;
  } catch (e) {
    console.warn('getBanner failed:', e);
    _cache = { ...DEFAULT_BANNER };
    return _cache;
  }
}
