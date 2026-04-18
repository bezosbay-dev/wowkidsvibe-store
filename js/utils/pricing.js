// Global pricing helper — single source of truth for Buy-1 display.
// Rule: if Shopify has compareAtPrice > price (admin-set discount), honor it.
// Otherwise force Buy 1 = 30% OFF with the raw Shopify price as the strike.
// This keeps cards, related products, and product page Buy 1 consistent.
export function getDiscountData(price, compareAtPrice) {
  const p = parseFloat(price) || 0;
  const c = compareAtPrice != null ? parseFloat(compareAtPrice) : 0;

  if (c > p && p > 0) {
    return {
      price: Math.round(p * 100) / 100,
      compareAtPrice: Math.round(c * 100) / 100,
      discount: Math.round((1 - p / c) * 100),
    };
  }

  const discount = 30;
  const salePrice = Math.round(p * 0.70 * 100) / 100;
  return {
    price: salePrice,
    compareAtPrice: Math.round(p * 100) / 100,
    discount,
  };
}
