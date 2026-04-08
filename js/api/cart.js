import { shopifyFetch } from './client.js';

const CART_ID_KEY = 'wowkidsvibe_cart_id';
const CART_CACHE_KEY = 'wowkidsvibe_cart_cache';

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
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
  if (cart) dispatchCartEvent(cart);
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
  if (cart) dispatchCartEvent(cart);
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
  if (cart) dispatchCartEvent(cart);
  return cart;
}

export function getCheckoutUrl(cart) {
  return cart?.checkoutUrl || '#';
}
