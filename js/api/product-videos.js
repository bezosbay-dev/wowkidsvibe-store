// Public read for product videos — Instagram Reels + TikTok per product.
// Returns [] when Supabase is not configured so PDPs hide the section
// gracefully during local dev / before the user runs setup.sql.

import { SUPABASE_CONFIG, SUPABASE_ENABLED, PRODUCT_VIDEOS_TABLE } from '../supabase-config.js';

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

const _cache = new Map();

export async function getProductVideos(handle) {
  if (!SUPABASE_ENABLED || !handle) return [];
  if (_cache.has(handle)) return _cache.get(handle);

  const q =
    `${PRODUCT_VIDEOS_TABLE}?product_handle=eq.${encodeURIComponent(handle)}` +
    `&status=eq.active` +
    `&order=display_order.asc,created_at.asc` +
    `&limit=24`;
  try {
    const res = await fetch(url(q), { headers: headers() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rows = await res.json();
    _cache.set(handle, rows);
    return rows;
  } catch (e) {
    console.warn('getProductVideos failed:', e);
    return [];
  }
}

// Helpers to extract the embed identifier from raw URLs the admin pastes.
// Accepts a wide range of input formats so the admin can copy/paste from
// the address bar or share menu without thinking about it.
export function parseInstagramReel(rawUrl) {
  if (!rawUrl) return null;
  // matches /reel/<id>/, /p/<id>/, /reels/<id>/
  const m = rawUrl.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  return {
    id: m[1],
    permalink: `https://www.instagram.com/reel/${m[1]}/`,
  };
}

export function parseTikTok(rawUrl) {
  if (!rawUrl) return null;
  // matches /video/<id> in standard URLs
  const m = rawUrl.match(/tiktok\.com\/.*?\/video\/(\d+)/i);
  if (m) return { id: m[1], permalink: rawUrl.split('?')[0] };
  // matches vm.tiktok.com / vt.tiktok.com short links — embed.js can handle them
  const short = rawUrl.match(/(?:vm|vt)\.tiktok\.com\/([A-Za-z0-9]+)/i);
  if (short) return { id: short[1], permalink: rawUrl.split('?')[0] };
  return null;
}
