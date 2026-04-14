import { shopifyFetch } from './client.js';

const TOKEN_KEY = 'woowfinds_customer_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function customerCreate(email, password, firstName = '', lastName = '') {
  const data = await shopifyFetch(`
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email firstName lastName }
        customerUserErrors { code field message }
      }
    }
  `, {
    input: { email, password, firstName, lastName }
  });

  if (data.customerCreate.customerUserErrors.length > 0) {
    throw new Error(data.customerCreate.customerUserErrors.map(e => e.message).join(', '));
  }

  return data.customerCreate.customer;
}

export async function customerRecover(email) {
  const data = await shopifyFetch(`
    mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { code field message }
      }
    }
  `, { email });

  if (data.customerRecover.customerUserErrors.length > 0) {
    throw new Error(data.customerRecover.customerUserErrors.map(e => e.message).join(', '));
  }
  return true;
}

export async function customerLogin(email, password) {
  const data = await shopifyFetch(`
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code field message }
      }
    }
  `, {
    input: { email, password }
  });

  if (data.customerAccessTokenCreate.customerUserErrors.length > 0) {
    throw new Error(data.customerAccessTokenCreate.customerUserErrors.map(e => e.message).join(', '));
  }

  const token = data.customerAccessTokenCreate.customerAccessToken.accessToken;
  storeToken(token);
  return token;
}

export async function getCustomer() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const data = await shopifyFetch(`
      query getCustomer($token: String!) {
        customer(customerAccessToken: $token) {
          id
          firstName
          lastName
          email
          phone
          defaultAddress {
            id address1 address2 city province zip country
          }
          orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                id
                orderNumber
                processedAt
                financialStatus
                fulfillmentStatus
                totalPrice { amount currencyCode }
                lineItems(first: 10) {
                  edges {
                    node {
                      title
                      quantity
                      variant {
                        image { url altText }
                        price { amount currencyCode }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, { token });

    return data.customer;
  } catch {
    clearToken();
    return null;
  }
}

// Returns true if the logged-in customer has a completed order containing the
// given product ID. Uses Storefront API only (no Admin token needed). Cached
// per session to avoid re-querying on every product page view.
const PURCHASE_CACHE_KEY = 'woowfinds_purchased_products';

function readPurchaseCache() {
  try { return JSON.parse(sessionStorage.getItem(PURCHASE_CACHE_KEY) || '{}'); }
  catch { return {}; }
}

function writePurchaseCache(obj) {
  try { sessionStorage.setItem(PURCHASE_CACHE_KEY, JSON.stringify(obj)); }
  catch { /* quota */ }
}

export async function hasPurchasedProduct(productId) {
  const token = getStoredToken();
  if (!token || !productId) return false;

  const cache = readPurchaseCache();
  if (cache[productId] === true) return true;
  if (cache[productId] === false && cache.__ts && Date.now() - cache.__ts < 5 * 60 * 1000) {
    return false;
  }

  try {
    const data = await shopifyFetch(`
      query getPurchaseHistory($token: String!) {
        customer(customerAccessToken: $token) {
          id
          orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
            edges {
              node {
                financialStatus
                lineItems(first: 50) {
                  edges {
                    node {
                      variant { product { id } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, { token });

    const customer = data.customer;
    if (!customer) return false;

    const purchasedIds = new Set();
    (customer.orders?.edges || []).forEach(orderEdge => {
      const order = orderEdge.node;
      if (order.financialStatus && ['VOIDED', 'REFUNDED'].includes(order.financialStatus)) return;
      (order.lineItems?.edges || []).forEach(liEdge => {
        const pid = liEdge.node.variant?.product?.id;
        if (pid) purchasedIds.add(pid);
      });
    });

    const fresh = { __ts: Date.now() };
    purchasedIds.forEach(id => { fresh[id] = true; });
    fresh[productId] = purchasedIds.has(productId);
    writePurchaseCache(fresh);

    return purchasedIds.has(productId);
  } catch (e) {
    console.error('hasPurchasedProduct error:', e);
    return false;
  }
}

export function clearPurchaseCache() {
  try { sessionStorage.removeItem(PURCHASE_CACHE_KEY); } catch {}
}

export async function customerLogout() {
  const token = getStoredToken();
  if (token) {
    try {
      await shopifyFetch(`
        mutation customerAccessTokenDelete($token: String!) {
          customerAccessTokenDelete(customerAccessToken: $token) {
            deletedAccessToken
          }
        }
      `, { token });
    } catch { /* ignore */ }
  }
  clearToken();
  clearPurchaseCache();
}
