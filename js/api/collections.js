import { shopifyFetch } from './client.js';

export async function getCollections(first = 12) {
  const data = await shopifyFetch(`
    query getCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            image { url altText }
          }
        }
      }
    }
  `, { first });

  return data.collections.edges.map(e => e.node);
}

export async function getCollectionByHandle(handle, { first = 12, after = null, sortKey = 'BEST_SELLING', reverse = false, filters = [] } = {}) {
  const data = await shopifyFetch(`
    query getCollection($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $filters: [ProductFilter!]) {
      collection(handle: $handle) {
        id
        title
        handle
        description
        image { url altText }
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
          edges {
            node {
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
                edges {
                  node {
                    id
                    availableForSale
                  }
                }
              }
            }
          }
          filters {
            id
            label
            type
            values { id label count input }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  `, { handle, first, after, sortKey, reverse, filters });

  return data.collection;
}
