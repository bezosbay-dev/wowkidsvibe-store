import { shopifyFetch } from './client.js';

export async function searchProducts(query, first = 12) {
  const data = await shopifyFetch(`
    query searchProducts($query: String!, $first: Int!) {
      search(query: $query, first: $first, types: [PRODUCT]) {
        edges {
          node {
            ... on Product {
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
              }
              variants(first: 1) {
                edges { node { id availableForSale } }
              }
            }
          }
        }
        totalCount
        pageInfo { hasNextPage endCursor }
      }
    }
  `, { query, first });

  return data.search;
}

export async function predictiveSearch(query) {
  const data = await shopifyFetch(`
    query predictiveSearch($query: String!) {
      predictiveSearch(query: $query, limit: 5, types: [PRODUCT]) {
        products {
          id
          title
          handle
          featuredImage { url altText }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  `, { query });

  return data.predictiveSearch;
}
