import { shopifyFetch } from './client.js';

const TOKEN_KEY = 'wowkidsvibe_customer_token';

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
}
