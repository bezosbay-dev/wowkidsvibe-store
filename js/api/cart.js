import { shopifyFetch } from './client.js';

const CART_ID_KEY = 'woowfinds_cart_id';
const CART_CACHE_KEY = 'woowfinds_cart_cache';
const DISCOUNT_CFG_KEY = 'wkv_discount_cfg';
const DISCOUNT_CFG_TTL = 30 * 60 * 1000; // 30 min

// ── Dynamic discount config ──────────────────────────────────────
// Fetched from Shopify shop metafield "custom.discount_config".
// Expected JSON value: {"buy1": 40, "buy2": 60, "buy3": 70}
// Change ONLY in Shopify Admin → the website picks it up automatically.
let discountConfig = { buy1: 40, buy2: 60, buy3: 70 };

export function getDiscountConfig() {
  return discountConfig;
}

export async function fetchDiscountConfig() {
  // Check sessionStorage cache first
  try {
    const cached = sessionStorage.getItem(DISCOUNT_CFG_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < DISCOUNT_CFG_TTL) {
        discountConfig = data;
        return data;
      }
    }
  } catch {}

  try {
    const result = await shopifyFetch(`{
      shop {
        metafield(namespace: "custom", key: "discount_config") {
          value
        }
      }
    }`);
    const raw = result?.shop?.metafield?.value;
    if (raw) {
      const parsed = JSON.parse(raw);
      const cfg = {
        buy1: Number(parsed.buy1) || 40,
        buy2: Number(parsed.buy2) || 60,
        buy3: Number(parsed.buy3) || 70,
      };
      discountConfig = cfg;
      try { sessionStorage.setItem(DISCOUNT_CFG_KEY, JSON.stringify({ data: cfg, ts: Date.now() })); } catch {}
      return cfg;
    }
  } catch (e) {
    console.warn('Discount config fetch failed, using defaults:', e.message);
  }
  return discountConfig;
}

// ── Discount tier helpers ────────────────────────────────────────
export function getDiscountTier(totalQuantity) {
  const c = discountConfig;
  const tiers = [
    { minQty: 3, discount: c.buy3 / 100, code: 'SAVE' + c.buy3 },
    { minQty: 2, discount: c.buy2 / 100, code: 'SAVE' + c.buy2 },
    { minQty: 1, discount: c.buy1 / 100, code: 'SAVE' + c.buy1 },
  ];
  return tiers.find(t => totalQuantity >= t.minQty) || tiers[tiers.length - 1];
}

// ── Cart GraphQL fragment ────────────────────────────────────────
const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    discountCodes { applicable code }
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
      totalTaxAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount { amount currencyCode }
            amountPerQuantity { amount currencyCode }
            compareAtAmountPerQuantity { amount currencyCode }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              image { url altText }
              product { title handle }
              selectedOptions { name value }
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
            }
          }
        }
      }
    }
  }
`;

// ── localStorage helpers ─────────────────────────────────────────
function getStoredCartId() {
  return localStorage.getItem(CART_ID_KEY);
}

function storeCartId(cartId) {
  localStorage.setItem(CART_ID_KEY, cartId);
}

function cacheCart(cart) {
  if (cart) {
    localStorage.setItem(CART_CACHE_KEY, JSON.stringify(cart));
  } else {
    localStorage.removeItem(CART_CACHE_KEY);
  }
}

function getCachedCart() {
  try {
    const cached = localStorage.getItem(CART_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function dispatchCartEvent(cart) {
  cacheCart(cart);
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
}

// ── Auto-apply discount code (fire-and-forget) ──────────────────
function applyDiscountToCart(cart) {
  if (!cart || !cart.id || cart.totalQuantity < 1) return;
  const tier = getDiscountTier(cart.totalQuantity);

  const existing = cart.discountCodes?.find(d => d.code === tier.code && d.applicable);
  if (existing) return;

  shopifyFetch(`
    mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, { cartId: cart.id, discountCodes: [tier.code] })
    .then(data => {
      const updated = data.cartDiscountCodesUpdate?.cart;
      if (updated) dispatchCartEvent(updated);
    })
    .catch(err => console.warn('Discount code not applied:', err.message));
}

// ── Cart mutations ───────────────────────────────────────────────
export async function createCart(lines = []) {
  const data = await shopifyFetch(`
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, { input: { lines } });

  const cart = data.cartCreate.cart;
  if (cart) {
    storeCartId(cart.id);
    dispatchCartEvent(cart);
    applyDiscountToCart(cart);
  }
  return cart;
}

export async function getCart() {
  const cartId = getStoredCartId();
  if (!cartId) return null;

  const cached = getCachedCart();
  if (cached) {
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: cached }));
  }

  try {
    const data = await shopifyFetch(`
      query getCart($cartId: ID!) {
        cart(id: $cartId) { ...CartFields }
      }
      ${CART_FRAGMENT}
    `, { cartId });

    if (data.cart) {
      dispatchCartEvent(data.cart);
      return data.cart;
    }
    localStorage.removeItem(CART_ID_KEY);
    cacheCart(null);
    return null;
  } catch {
    localStorage.removeItem(CART_ID_KEY);
    cacheCart(null);
    return cached || null;
  }
}

// Add multiple line items at once (used for Buy 2 / Buy 3 bundles).
// items: [{ variantId: "gid://...", quantity: 1 }, ...]
export async function addMultipleToCart(items) {
  const lines = items.map(i => ({ merchandiseId: i.variantId, quantity: i.quantity }));
  let cartId = getStoredCartId();

  if (!cartId) {
    return await createCart(lines);
  }

  try {
    const data = await shopifyFetch(`
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
      ${CART_FRAGMENT}
    `, { cartId, lines });

    const cart = data.cartLinesAdd.cart;
    if (cart) {
      dispatchCartEvent(cart);
      applyDiscountToCart(cart);
    }
    return cart;
  } catch (err) {
    console.warn('Cart add failed, creating new cart:', err.message);
    localStorage.removeItem(CART_ID_KEY);
    cacheCart(null);
    return await createCart(lines);
  }
}

// Single-item convenience wrapper
export async function addToCart(variantId, quantity = 1) {
  return addMultipleToCart([{ variantId, quantity }]);
}

export async function updateCartLine(lineId, quantity) {
  const cartId = getStoredCartId();
  if (!cartId) return null;

  const data = await shopifyFetch(`
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, { cartId, lines: [{ id: lineId, quantity }] });

  const cart = data.cartLinesUpdate.cart;
  if (cart) {
    dispatchCartEvent(cart);
    applyDiscountToCart(cart);
  }
  return cart;
}

export async function removeCartLine(lineId) {
  const cartId = getStoredCartId();
  if (!cartId) return null;

  const data = await shopifyFetch(`
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, { cartId, lineIds: [lineId] });

  const cart = data.cartLinesRemove.cart;
  if (cart) {
    dispatchCartEvent(cart);
    applyDiscountToCart(cart);
  }
  return cart;
}

export function getCheckoutUrl(cart) {
  if (!cart?.checkoutUrl) return '#';
  const tier = getDiscountTier(cart.totalQuantity || 1);
  try {
    const url = new URL(cart.checkoutUrl);
    url.searchParams.set('discount', tier.code);
    return url.toString();
  } catch {
    return cart.checkoutUrl + (cart.checkoutUrl.includes('?') ? '&' : '?') + 'discount=' + tier.code;
  }
}
