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
      <div class="product-card">
        <a href="${url}">
          <img src="${image}" alt="${title}" onerror="this.src='/fallback.jpg'"/>
          <h3>${title}</h3>
          <p>${formatMoney(price.amount, price.currencyCode)}</p>
        </a>
        <button class="add-to-cart-btn" data-variant-id="${variantId}">
          Add to Cart
        </button>
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
    <div class="product-card">
      <a href="${url}">
        <img src="${image}" alt="${title}" onerror="this.src='/fallback.jpg'"/>
        <h3>${title}</h3>
        <p>${formatMoney(price.amount, price.currencyCode)}</p>
      </a>
      <button class="add-to-cart-btn" data-variant-id="${variantId}">
        Add to Cart
      </button>
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