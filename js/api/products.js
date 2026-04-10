import { shopifyFetch } from './client.js';

// Session-scoped product cache (5 minute TTL) — reduces Shopify API calls on
// back/forward navigation and variant switches. sessionStorage (not
// localStorage) because product data should be fresh per tab session.
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_PREFIX = 'wkv_prod_';

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data })); }
  catch { /* quota exceeded — silently drop */ }
}

export function clearProductCache() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {}
}

const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    title
    handle
    productType
    tags
    featuredImage { url altText }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    variants(first: 1) {
      edges {
        node {
          id
          availableForSale
        }
      }
    }
  }
`;

export async function getProducts({ first = 12, after = null, sortKey = 'BEST_SELLING', reverse = false, query = '' } = {}) {
  const data = await shopifyFetch(`
    query getProducts($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
        edges {
          node { ...ProductCard }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
    ${PRODUCT_CARD_FRAGMENT}
  `, { first, after, sortKey, reverse, query });

  return data.products;
}

export async function getProductByHandle(handle) {
  const cached = cacheGet('handle_' + handle);
  if (cached) return cached;

  const data = await shopifyFetch(`
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        productType
        tags
        vendor
        seo { title description }
        images(first: 10) {
          edges { node { url altText width height } }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              availableForSale
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              selectedOptions { name value }
              image { url altText }
            }
          }
        }
        options {
          id name values
        }
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        compareAtPriceRange {
          minVariantPrice { amount currencyCode }
        }
      }
    }
  `, { handle });

  if (data.product) cacheSet('handle_' + handle, data.product);
  return data.product;
}

export async function getProductRecommendations(productId) {
  const cached = cacheGet('recs_' + productId);
  if (cached) return cached;

  const data = await shopifyFetch(`
    query getRecommendations($productId: ID!) {
      productRecommendations(productId: $productId) {
        ...ProductCard
      }
    }
    ${PRODUCT_CARD_FRAGMENT}
  `, { productId });

  const recs = data.productRecommendations || [];
  cacheSet('recs_' + productId, recs);
  return recs;
}
