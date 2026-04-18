// Global pricing helper — single source of truth for Buy-1 display.
// Rule: force Buy 1 = 30% OFF on every product, regardless of what Shopify's
// compareAtPrice says. Sale = price × 0.70, strike = raw Shopify price.
// The compareAtPrice argument is accepted but intentionally ignored so the
// storefront never shows a mixed 20% / 25% / 40% off message per product.
export function getDiscountData(price, _compareAtPrice) {
  const p = parseFloat(price) || 0;
  const discount = 30;
  const salePrice = Math.round(p * 0.70 * 100) / 100;
  return {
    price: salePrice,
    compareAtPrice: Math.round(p * 100) / 100,
    discount,
  };
}
