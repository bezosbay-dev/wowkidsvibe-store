import { shopifyFetch } from './client.js';

const CART_ID_KEY = 'wowkidsvibe_cart_id';
const CART_CACHE_KEY = 'wowkidsvibe_cart_cache';

// Bundle discount tiers — must match the product page bundle options.
// Buy 1 = 40% off, Buy 2 = 60% off, Buy 3+ = 70% off.
// Each code must exist in Shopify Admin → Discounts.
export const DISCOUNT_TIERS = [
  { minQty: 3, discount: 0.70, code: 'SAVE70' },
  { minQty: 2, discount: 0.60, code: 'SAVE60' },
  { minQty: 1, discount: 0.40, code: 'SAVE40' },
];

export function getDiscountTier(totalQuantity) {
  return DISCOUNT_TIERS.find(t => totalQuantity >= t.minQty) || DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1];
}

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

// Apply a discount code to the Shopify cart (fire-and-forget).
// The cart drawer shows client-side calculated prices regardless,
// but this ensures checkout charges the discounted amount.
function applyDiscountToCart(cart) {
  if (!cart || !cart.id || cart.totalQuantity < 1) return;
  const tier = getDiscountTier(cart.totalQuantity);

  // Skip if already applied
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

export async function createCart(lines = []) {
  const data = await shopifyFetch(`
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, {
    input: { lines }
  });

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

  // Show cached cart immediately while fetching fresh data
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

export async function addToCart(variantId, quantity = 1) {
  let cartId = getStoredCartId();

  if (!cartId) {
    const cart = await createCart([{ merchandiseId: variantId, quantity }]);
    return cart;
  }

  const data = await shopifyFetch(`
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, {
    cartId,
    lines: [{ merchandiseId: variantId, quantity }]
  });

  const cart = data.cartLinesAdd.cart;
  if (cart) {
    dispatchCartEvent(cart);
    applyDiscountToCart(cart);
  }
  return cart;
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
  `, {
    cartId,
    lines: [{ id: lineId, quantity }]
  });

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
  `, {
    cartId,
    lineIds: [lineId]
  });

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
