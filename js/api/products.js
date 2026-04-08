import { shopifyFetch } from './client.js';

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
              quantityAvailable
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

  return data.product;
}

export async function getProductRecommendations(productId) {
  const data = await shopifyFetch(`
    query getRecommendations($productId: ID!) {
      productRecommendations(productId: $productId) {
        ...ProductCard
      }
    }
    ${PRODUCT_CARD_FRAGMENT}
  `, { productId });

  return data.productRecommendations || [];
}
