import { formatMoney } from '../api/client.js';
import { addToCart } from '../api/cart.js';
import { showToast } from './toast.js';
import { openCartDrawer } from './header.js';

// Sitewide discount — matches the "Buy 1 = 40% OFF" bundle logic on the product page.
// The Shopify price field holds the original/base price; the customer actually pays 40% less.
const SITEWIDE_DISCOUNT = 0.40;

export function renderProductCard(product, style = 'default') {
  const rawPrice = product.priceRange.minVariantPrice;
  const rawAmount = parseFloat(rawPrice.amount);
  const saleAmount = Math.round(rawAmount * (1 - SITEWIDE_DISCOUNT) * 100) / 100;
  const price = { amount: String(saleAmount), currencyCode: rawPrice.currencyCode };
  const compareAt = rawPrice; // original Shopify price shown as strikethrough
  const hasDiscount = true;
  const discountPercent = Math.round(SITEWIDE_DISCOUNT * 100);
  const variantId = product.variants?.edges?.[0]?.node?.id || '';
  const image = product.featuredImage;
  const tag = product.tags?.[0] || '';
  const url = `/product.html?handle=${product.handle}`;

  if (style === 'collection') {
    return renderCollectionCard(product, price, compareAt, hasDiscount, discountPercent, variantId, image, tag, url);
  }

  // DEFAULT CARD — homepage trending, search results
  return `
    <div class="product-card group animate-on-scroll">
      <a href="${url}" class="block">
        <div class="product-card-img aspect-square rounded-2xl bg-surface-container-low mb-4">
          ${hasDiscount ? `<div class="absolute top-3 left-3 z-10 bg-primary text-on-primary font-label px-3 py-1 rounded-full text-xs">SAVE ${discountPercent}%</div>` : ''}
          ${tag ? `<div class="absolute top-3 ${hasDiscount ? 'left-24' : 'left-3'} z-10 bg-tertiary text-on-tertiary font-label px-3 py-1 rounded-full text-xs uppercase">${tag}</div>` : ''}
          ${image
            ? `<img class="w-full h-full object-cover" src="${image.url}" alt="${image.altText || product.title}" loading="lazy" />`
            : '<div class="w-full h-full flex items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined text-6xl">image</span></div>'
          }
          <div class="card-overlay"></div>
          <div class="card-atc">
            <button class="add-to-cart-btn w-full py-3 kinetic-gradient text-white rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow" data-variant-id="${variantId}" onclick="event.preventDefault();event.stopPropagation();">
              <span class="material-symbols-outlined text-lg">shopping_bag</span> Add to Cart
            </button>
          </div>
        </div>
      </a>
      <a href="${url}" class="block">
        <h3 class="font-headline font-bold text-base mb-1 line-clamp-2">${product.title}</h3>
        <p class="text-on-surface-variant text-sm mb-2">${product.productType || ''}</p>
        <div class="flex items-center gap-3">
          <span class="text-lg font-headline font-extrabold text-primary">${formatMoney(price.amount, price.currencyCode)}</span>
          ${hasDiscount ? `<span class="text-on-surface-variant line-through text-sm">${formatMoney(compareAt.amount, compareAt.currencyCode)}</span>` : ''}
        </div>
      </a>
    </div>
  `;
}

// COLLECTION CARD — collection page grid
function renderCollectionCard(product, price, compareAt, hasDiscount, discountPercent, variantId, image, tag, url) {
  return `
    <div class="product-card group animate-on-scroll cursor-pointer" onclick="window.location='${url}'">
      <div class="bg-surface-container-low rounded-2xl overflow-hidden transition-shadow duration-300 group-hover:shadow-xl">
        <div class="product-card-img aspect-square">
          ${image
            ? `<img alt="${image.altText || product.title}" class="w-full h-full object-cover" src="${image.url}" loading="lazy" />`
            : '<div class="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-6xl">image</span></div>'
          }
          <div class="card-overlay"></div>
          <div class="card-atc">
            <button class="add-to-cart-btn w-full py-3 kinetic-gradient text-white rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow" data-variant-id="${variantId}" onclick="event.stopPropagation();">
              <span class="material-symbols-outlined text-lg">shopping_bag</span> Add to Cart
            </button>
          </div>
        </div>
        <div class="p-5 space-y-3">
          <div class="flex justify-between items-start">
            ${hasDiscount
              ? `<span class="vibe-badge bg-primary-container text-on-primary-container px-3 py-1 text-[10px] font-bold">SAVE ${discountPercent}%</span>`
              : tag
                ? `<span class="vibe-badge bg-tertiary-container text-on-tertiary-container px-3 py-1 text-[10px] font-bold uppercase">${tag}</span>`
                : '<span></span>'
            }
            <span></span>
          </div>
          <h2 class="text-lg font-headline font-extrabold text-on-surface line-clamp-2">${product.title}</h2>
          <div class="flex items-center justify-between">
            <span class="text-xl font-label font-bold text-primary">${formatMoney(price.amount, price.currencyCode)}</span>
            ${hasDiscount ? `<span class="text-sm text-on-surface-variant line-through">${formatMoney(compareAt.amount, compareAt.currencyCode)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function setupAddToCartButtons(container = document) {
  container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const variantId = btn.dataset.variantId;
      if (!variantId) return;

      btn.disabled = true;
      const origHTML = btn.innerHTML;
      btn.innerHTML = '<span class="material-symbols-outlined text-lg animate-spin">progress_activity</span> Adding...';

      try {
        await addToCart(variantId, 1);
        btn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span> Added!';
        showToast('Added to cart!', 'success');
        openCartDrawer();
        setTimeout(() => { btn.innerHTML = origHTML; }, 1500);
      } catch (err) {
        showToast('Failed to add to cart', 'error');
        btn.innerHTML = origHTML;
      } finally {
        btn.disabled = false;
      }
    });
  });
}
