import { formatMoney } from '../api/client.js';
import { addToCart } from '../api/cart.js';
import { showToast } from './toast.js';
import { openCartDrawer } from './header.js';

export function renderProductCard(product, style = 'default') {
  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const hasDiscount = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount);
  const discountPercent = hasDiscount
    ? Math.round((1 - parseFloat(price.amount) / parseFloat(compareAt.amount)) * 100)
    : 0;
  const variantId = product.variants?.edges?.[0]?.node?.id || '';
  const image = product.featuredImage;
  const tag = product.tags?.[0] || '';
  const url = `/product.html?handle=${product.handle}`;

  if (style === 'collection') {
    return renderCollectionCard(product, price, compareAt, hasDiscount, discountPercent, variantId, image, tag, url);
  }

  return `
    <a href="${url}" class="group block animate-on-scroll">
      <div class="aspect-square rounded-2xl bg-surface-container-low overflow-hidden relative mb-4">
        ${hasDiscount ? `<div class="absolute top-3 left-3 z-10 bg-primary text-on-primary font-label px-3 py-1 rounded-full text-xs">SAVE ${discountPercent}%</div>` : ''}
        ${tag ? `<div class="absolute top-3 ${hasDiscount ? 'left-24' : 'left-3'} z-10 bg-tertiary text-on-tertiary font-label px-3 py-1 rounded-full text-xs uppercase">${tag}</div>` : ''}
        ${image
          ? `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${image.url}" alt="${image.altText || product.title}" loading="lazy" />`
          : '<div class="w-full h-full flex items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined text-6xl">image</span></div>'
        }
      </div>
      <h3 class="font-headline font-bold text-base mb-1 line-clamp-2">${product.title}</h3>
      <p class="text-on-surface-variant text-sm mb-2">${product.productType || ''}</p>
      <div class="flex items-center gap-3">
        <span class="text-lg font-headline font-extrabold text-primary">${formatMoney(price.amount, price.currencyCode)}</span>
        ${hasDiscount ? `<span class="text-on-surface-variant line-through text-sm">${formatMoney(compareAt.amount, compareAt.currencyCode)}</span>` : ''}
      </div>
    </a>
  `;
}

function renderCollectionCard(product, price, compareAt, hasDiscount, discountPercent, variantId, image, tag, url) {
  return `
    <div class="group relative animate-on-scroll" style="cursor:pointer;" onclick="window.location='${url}'">
      <div class="bg-surface-container-low rounded-2xl overflow-hidden transition-all duration-300 group-hover:bg-surface-container-high group-hover:shadow-lg">
        <div class="aspect-square overflow-hidden">
          ${image
            ? `<img alt="${image.altText || product.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${image.url}" loading="lazy" />`
            : '<div class="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-6xl">image</span></div>'
          }
        </div>
        <div class="p-5 space-y-3">
          <div class="flex justify-between items-start">
            ${hasDiscount
              ? `<span class="vibe-badge bg-primary-container text-on-primary-container px-3 py-1 text-[10px] font-bold">SAVE ${discountPercent}%</span>`
              : tag
                ? `<span class="vibe-badge bg-tertiary-container text-on-tertiary-container px-3 py-1 text-[10px] font-bold uppercase">${tag}</span>`
                : '<span></span>'
            }
            <div class="flex items-center gap-1 text-secondary">
              <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">star</span>
              <span class="text-xs font-bold text-on-surface">4.9</span>
            </div>
          </div>
          <h2 class="text-lg font-headline font-extrabold text-on-surface line-clamp-2">${product.title}</h2>
          <div class="flex items-center justify-between">
            <span class="text-xl font-label font-bold text-primary">${formatMoney(price.amount, price.currencyCode)}</span>
            <button class="add-to-cart-btn z-20 premium-gradient text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform" data-variant-id="${variantId}" aria-label="Add to cart" onclick="event.stopPropagation()">
              <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function setupAddToCartButtons(container = document) {
  container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const variantId = btn.dataset.variantId;
      if (!variantId) return;

      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>';

      try {
        await addToCart(variantId, 1);
        showToast('Added to cart!', 'success');
        openCartDrawer();
      } catch (err) {
        showToast('Failed to add to cart', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">add_shopping_cart</span>';
      }
    });
  });
}