import { formatMoney } from '../api/client.js';
import { addToCart, getDiscountConfig } from '../api/cart.js';
import { showToast } from './toast.js';
import { openCartDrawer } from './header.js';

export function renderProductCard(product, style = 'default') {
  try {
    if (!product) return '';

    const cfg = getDiscountConfig() || { buy1: 0 };
    const sitewideDiscount = (cfg.buy1 || 0) / 100;

    const rawPrice = product?.priceRange?.minVariantPrice;
    const rawAmount = parseFloat(rawPrice?.amount || 0);

    const saleAmount =
      Math.round(rawAmount * (1 - sitewideDiscount) * 100) / 100;

    const price = {
      amount: String(saleAmount || 0),
      currencyCode: rawPrice?.currencyCode || 'USD'
    };

    const compareAt = rawPrice || { amount: '0', currencyCode: 'USD' };
    const hasDiscount = sitewideDiscount > 0;
    const discountPercent = Math.round(sitewideDiscount * 100);

    const variantId =
      product?.variants?.edges?.[0]?.node?.id || '';

    const image =
      product?.featuredImage?.url ||
      product?.images?.edges?.[0]?.node?.url ||
      '/fallback.jpg';

    const tag = product?.tags?.[0] || '';
    const url = `/product.html?handle=${product?.handle || ''}`;
    const title = product?.title || 'Product';

    if (style === 'collection') {
      return renderCollectionCard(
        title,
        price,
        compareAt,
        hasDiscount,
        discountPercent,
        variantId,
        image,
        tag,
        url
      );
    }

    return `
  <div class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition">

    <a href="${url}" class="block relative">

      <div class="aspect-square overflow-hidden">
        <img 
          src="${image}" 
          alt="${title}" 
          class="w-full h-full object-cover"
          onerror="this.src='/fallback.jpg'"
        />
      </div>

      ${hasDiscount ? `
        <div class="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
          SAVE ${discountPercent}%
        </div>
      ` : ''}

      <button 
        class="add-to-cart-btn absolute bottom-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:bg-red-600 transition"
        data-variant-id="${variantId}">
        Add to Cart
      </button>

    </a>

    <div class="p-3 space-y-1">

      <h3 class="text-sm font-medium text-gray-800 line-clamp-2">
        ${title}
      </h3>

      <div class="flex items-center gap-2">
        <span class="text-red-600 font-bold text-sm">
          ${formatMoney(price.amount, price.currencyCode)}
        </span>

        ${hasDiscount ? `
          <span class="text-gray-400 line-through text-xs">
            ${formatMoney(compareAt.amount, compareAt.currencyCode)}
          </span>
        ` : ''}
      </div>

    </div>

  </div>
`;
  } catch (err) {
    console.error('renderProductCard error:', err, product);
    return '';
  }
}

function renderCollectionCard(
  title,
  price,
  compareAt,
  hasDiscount,
  discountPercent,
  variantId,
  image,
  tag,
  url
) {
  return `
  <div class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition">

    <a href="${url}" class="block relative">

      <!-- IMAGE -->
      <div class="aspect-square overflow-hidden">
        <img 
          src="${image}" 
          alt="${title}" 
          class="w-full h-full object-cover"
          onerror="this.src='/fallback.jpg'"
        />
      </div>

      <!-- DISCOUNT BADGE -->
      ${hasDiscount ? `
        <div class="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
          SAVE ${discountPercent}%
        </div>
      ` : ''}

      <!-- ADD TO CART -->
      <button 
        class="add-to-cart-btn absolute bottom-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:bg-red-600 transition"
        data-variant-id="${variantId}">
        Add to Cart
      </button>

    </a>

    <!-- CONTENT -->
    <div class="p-3 space-y-1">

      <h3 class="text-sm font-medium text-gray-800 line-clamp-2">
        ${title}
      </h3>

      <div class="flex items-center gap-2">
        <span class="text-red-600 font-bold text-sm">
          ${formatMoney(price.amount, price.currencyCode)}
        </span>

        ${hasDiscount ? `
          <span class="text-gray-400 line-through text-xs">
            ${formatMoney(compareAt.amount, compareAt.currencyCode)}
          </span>
        ` : ''}
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

      try {
        await addToCart(variantId, 1);
        showToast('Added to cart!', 'success');
        openCartDrawer();
      } catch (err) {
        showToast('Failed to add to cart', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });
}