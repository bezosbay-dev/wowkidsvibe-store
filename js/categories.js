// Shared category definitions used by homepage, collection page, and filters.
export const CATEGORIES = [
  { key: 'all',             label: 'All',              emoji: '✨' },
  { key: 'viral-finds',     label: 'Viral Finds',      emoji: '🔥' },
  { key: 'kids-toys',       label: 'Kids & Toys',      emoji: '🧸' },
  { key: 'baby-essentials', label: 'Baby Essentials',  emoji: '👶' },
  { key: 'home-decor',      label: 'Home Decor',       emoji: '🏠' },
  { key: 'kitchen-living',  label: 'Kitchen & Living', emoji: '🍳' },
  { key: 'gadgets-tech',    label: 'Gadgets & Tech',   emoji: '📱' },
  { key: 'fashion-style',   label: 'Fashion & Style',  emoji: '👗' },
  { key: 'outdoor-sports',  label: 'Outdoor & Sports', emoji: '🏃' },
  { key: 'health-beauty',   label: 'Health & Beauty',  emoji: '💄' },
  { key: 'pet-supplies',    label: 'Pet Supplies',     emoji: '🐾' },
  { key: 'gifts-bundles',   label: 'Gifts & Bundles',  emoji: '🎁' },
];

export function findCategory(key) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0];
}

// Build a Shopify Storefront API query string that matches products whose
// productType OR tags contain the category label or slug. Matches common
// variations (spaces, hyphens, "&" vs "and").
export function buildCategoryQuery(key) {
  if (!key || key === 'all') return '';
  const cat = findCategory(key);
  if (!cat) return '';

  const label = cat.label;
  const slug = cat.key;
  const labelAnd = label.replace(/&/g, 'and');
  const labelNoAmp = label.replace(/\s*&\s*/g, ' ');
  const firstWord = label.split(/\s|&/)[0];

  const terms = Array.from(new Set([label, labelAnd, labelNoAmp, slug, firstWord]));
  const parts = [];
  terms.forEach(t => {
    const safe = t.replace(/"/g, '\\"');
    parts.push(`product_type:"${safe}"`);
    parts.push(`tag:"${safe}"`);
  });
  return parts.join(' OR ');
}
