import { SHOPIFY_CONFIG, STOREFRONT_URL } from '../shopify-config.js';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query, variables) {
  return 'wkv_' + btoa(JSON.stringify({ q: query.trim().replace(/\s+/g, ' '), v: variables })).slice(0, 80);
}

function getCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function setCache(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota exceeded */ }
}

export async function shopifyFetch(query, variables = {}) {
  // Skip cache for mutations
  const isMutation = query.trimStart().startsWith('mutation');
  if (!isMutation) {
    const cacheKey = getCacheKey(query, variables);
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  const response = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }

  if (!isMutation) {
    setCache(getCacheKey(query, variables), json.data);
  }

  return json.data;
}

export function formatMoney(amount, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

export function getImageUrl(src, size = '600x') {
  if (!src) return '';
  if (src.includes('cdn.shopify.com')) {
    return src.replace(/(\.\w+)(\?|$)/, `_${size}$1$2`);
  }
  return src;
}
