// Admin CRUD — Reviews / Videos / Featured / Banner.
// All write paths require an authenticated Supabase session whose JWT email
// matches ADMIN_EMAIL — RLS enforces it server-side.

import { adminHeaders, restUrl } from './supabase-client.js';
import {
  REVIEWS_TABLE,
  PRODUCT_VIDEOS_TABLE,
  FEATURED_TABLE,
  SITE_SETTINGS_TABLE,
} from '../supabase-config.js';

async function req(path, init = {}) {
  const headers = await adminHeaders();
  const res = await fetch(restUrl(path), {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} — ${body || res.statusText}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Reviews ──────────────────────────────────────────────────────────
export async function listAllReviews({ status, productHandle } = {}) {
  let q = `${REVIEWS_TABLE}?order=created_at.desc&limit=500`;
  if (status) q += `&status=eq.${encodeURIComponent(status)}`;
  if (productHandle) q += `&product_handle=eq.${encodeURIComponent(productHandle)}`;
  return req(q);
}

export async function updateReview(id, patch) {
  return req(`${REVIEWS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(patch),
  });
}

export async function deleteReview(id) {
  return req(`${REVIEWS_TABLE}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── Videos ───────────────────────────────────────────────────────────
export async function listVideos(productHandle = null) {
  let q = `${PRODUCT_VIDEOS_TABLE}?order=display_order.asc,created_at.desc&limit=500`;
  if (productHandle) q += `&product_handle=eq.${encodeURIComponent(productHandle)}`;
  return req(q);
}

export async function addVideo({ productHandle, productId, platform, embedUrl, caption, displayOrder }) {
  const row = {
    product_handle: productHandle,
    product_id:     productId || null,
    platform,
    embed_url:      embedUrl,
    caption:        caption || null,
    display_order:  Number.isFinite(displayOrder) ? displayOrder : 0,
    status:         'active',
  };
  return req(PRODUCT_VIDEOS_TABLE, {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(row),
  });
}

export async function updateVideo(id, patch) {
  return req(`${PRODUCT_VIDEOS_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(patch),
  });
}

export async function deleteVideo(id) {
  return req(`${PRODUCT_VIDEOS_TABLE}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── Featured products ────────────────────────────────────────────────
export async function listFeatured() {
  return req(`${FEATURED_TABLE}?order=display_order.asc,created_at.asc&limit=200`);
}

export async function addFeatured(productHandle, displayOrder = 0) {
  return req(FEATURED_TABLE, {
    method: 'POST',
    headers: { 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify({ product_handle: productHandle, display_order: displayOrder, status: 'active' }),
  });
}

export async function removeFeatured(id) {
  return req(`${FEATURED_TABLE}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function reorderFeatured(rows) {
  // rows: [{id, display_order}]. Sequential PATCHes — fine for ≤50 rows.
  for (const r of rows) {
    await req(`${FEATURED_TABLE}?id=eq.${encodeURIComponent(r.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ display_order: r.display_order }),
    });
  }
}

// ─── Banner / site_settings ───────────────────────────────────────────
export async function getBannerAdmin() {
  const rows = await req(`${SITE_SETTINGS_TABLE}?key=eq.promo_banner&select=value&limit=1`);
  return (Array.isArray(rows) && rows[0]) ? rows[0].value : null;
}

export async function updateBanner(value) {
  // Upsert via POST + Prefer resolution=merge-duplicates.
  return req(SITE_SETTINGS_TABLE, {
    method: 'POST',
    headers: {
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify({ key: 'promo_banner', value }),
  });
}

// ─── Shopify product picker (admin uses Storefront API just like the rest of the site) ─────
import { SHOPIFY_CONFIG, STOREFRONT_URL } from '../shopify-config.js';

export async function searchShopifyProducts(query) {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontToken,
    },
    body: JSON.stringify({
      query: `query($q:String!){products(first:10,query:$q){edges{node{id handle title featuredImage{url}}}}}`,
      variables: { q: query.trim() },
    }),
  });
  const json = await res.json();
  return (json?.data?.products?.edges || []).map(e => e.node);
}
