// ============================================================
// SHOPIFY STOREFRONT API CONFIGURATION
// ============================================================
//
// PASTE YOUR STOREFRONT API ACCESS TOKEN ON LINE 15 BELOW
//
// To get your token:
//   1. Go to your Shopify Admin: https://wiowkidz.myshopify.com/admin
//   2. Settings > Apps and sales channels > Develop apps
//   3. Create an app (or select "Headless") > Configure Storefront API scopes
//   4. Install the app > Copy the Storefront API access token
//   5. Paste it below, replacing YOUR_STOREFRONT_ACCESS_TOKEN
//
export const SHOPIFY_CONFIG = {
  storefrontToken: 'c6e24ddf6d811abf164c7a36aea6c24c',  // <-- PASTE YOUR TOKEN HERE
  domain: 'wiowkidz.myshopify.com',
  apiVersion: '2025-04'
};

// All API calls go through this single endpoint — do not edit
export const STOREFRONT_URL = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;
