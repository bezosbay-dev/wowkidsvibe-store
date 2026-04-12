import { getCart, updateCartLine, removeCartLine, getDiscountTier, getCheckoutUrl } from '../api/cart.js';
import { formatMoney } from '../api/client.js';
import { cartItemSkeleton } from '../components/skeleton.js';

export async function initCartPage() {
  const container = document.getElementById('cart-items');
  if (container) container.innerHTML = cartItemSkeleton(2);

  window.addEventListener('cart:updated', (e) => renderCartPage(e.detail));

  const cart = await getCart();
  renderCartPage(cart);
}

function renderCartPage(cart) {
  const itemsContainer = document.getElementById('cart-items');
  const summaryContainer = document.getElementById('cart-summary');
  const emptyState = document.getElementById('cart-empty');
  const cartContent = document.getElementById('cart-content');

  if (!cart || cart.lines.edges.length === 0) {
    if (cartContent) cartContent.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (cartContent) cartContent.style.display = 'grid';
  if (emptyState) emptyState.style.display = 'none';

  // Render items
  const tier = getDiscountTier(cart.totalQuantity);
  let discountedSubtotal = 0;

  if (itemsContainer) {
    itemsContainer.innerHTML = cart.lines.edges.map(({ node }) => {
      const m = node.merchandise;
      const originalPrice = parseFloat(m.price.amount);
      const discountedPrice = Math.round(originalPrice * (1 - tier.discount) * 100) / 100;
      const lineTotal = Math.round(discountedPrice * node.quantity * 100) / 100;
      const originalLineTotal = Math.round(originalPrice * node.quantity * 100) / 100;
      discountedSubtotal += lineTotal;

      return `
        <div class="flex flex-col md:flex-row gap-6 p-6 bg-surface-container-lowest rounded-lg soft-shadow group transition-all hover:scale-[1.01]">
          <a href="product.html?handle=${m.product.handle}" class="relative w-full md:w-40 h-40 flex-shrink-0 bg-surface-container rounded-lg overflow-hidden">
            ${m.image ? `<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${m.image.url}" alt="${m.image.altText || m.product.title}" />` : ''}
          </a>
          <div class="flex-grow space-y-2">
            <div class="flex justify-between">
              <a href="product.html?handle=${m.product.handle}" class="font-headline font-bold text-xl hover:text-primary transition-colors">${m.product.title}</a>
              <button class="cart-remove text-outline-variant hover:text-error transition-colors" data-line-id="${node.id}">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
            <p class="text-on-surface-variant font-body">${m.selectedOptions.map(o => `${o.name}: ${o.value}`).join(' | ')}</p>
            <div class="flex justify-between items-end mt-4">
              <div class="flex items-center bg-surface-container rounded-full p-1">
                <button class="cart-qty w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors" data-line-id="${node.id}" data-action="decrease" data-qty="${node.quantity}">-</button>
                <span class="px-4 font-headline font-bold">${node.quantity}</span>
                <button class="cart-qty w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors" data-line-id="${node.id}" data-action="increase" data-qty="${node.quantity}">+</button>
              </div>
              <div class="text-right">
                <span class="block text-sm text-outline line-through">${formatMoney(originalLineTotal)}</span>
                <span class="font-headline font-extrabold text-2xl text-on-surface">${formatMoney(lineTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire up buttons
    itemsContainer.querySelectorAll('.cart-qty').forEach(btn => {
      btn.addEventListener('click', async () => {
        const lineId = btn.dataset.lineId;
        const qty = parseInt(btn.dataset.qty);
        if (btn.dataset.action === 'decrease') {
          if (qty <= 1) await removeCartLine(lineId);
          else await updateCartLine(lineId, qty - 1);
        } else {
          await updateCartLine(lineId, qty + 1);
        }
      });
    });

    itemsContainer.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', () => removeCartLine(btn.dataset.lineId));
    });
  }

  // Render summary
  if (summaryContainer) {
    const itemCount = cart.lines.edges.reduce((sum, { node }) => sum + node.quantity, 0);
    const originalSubtotal = cart.lines.edges.reduce((sum, { node }) => sum + parseFloat(node.merchandise.price.amount) * node.quantity, 0);
    const youSave = Math.round((originalSubtotal - discountedSubtotal) * 100) / 100;
    summaryContainer.innerHTML = `
      <div class="bg-surface-container-highest rounded-lg p-8 soft-shadow">
        <h2 class="font-headline font-bold text-2xl mb-6">Order Summary</h2>
        <div class="space-y-4 font-body">
          <div class="flex justify-between text-on-surface-variant">
            <span>Subtotal (${itemCount} items)</span>
            <span class="font-bold text-on-surface line-through">${formatMoney(originalSubtotal)}</span>
          </div>
          <div class="flex justify-between text-green-600">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">local_offer</span> ${Math.round(tier.discount * 100)}% OFF</span>
            <span class="font-bold">-${formatMoney(youSave)}</span>
          </div>
          <div class="flex justify-between text-on-surface-variant">
            <span>Shipping</span>
            <span class="text-on-surface font-bold text-primary">FREE</span>
          </div>
          <div class="pt-6 mt-6 border-t border-outline-variant/20">
            <div class="flex justify-between items-end">
              <span class="font-headline font-bold text-xl">Total</span>
              <span class="font-headline font-extrabold text-3xl text-on-surface">${formatMoney(discountedSubtotal)}</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-2">Taxes calculated at checkout</p>
          </div>
        </div>
        <div class="flex items-center justify-center gap-2 bg-primary/10 text-primary py-3 rounded-xl border border-primary/20 mb-4 mt-6">
          <span class="material-symbols-outlined text-xl">local_shipping</span>
          <span class="font-headline font-bold text-sm tracking-tight uppercase">Free Shipping on All Orders</span>
        </div>
        <a href="${getCheckoutUrl(cart)}" class="w-full mt-4 py-4 kinetic-gradient text-white rounded-full font-headline font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
          Secure Checkout <span class="material-symbols-outlined">arrow_forward</span>
        </a>
        <div class="mt-8 pt-8 border-t border-outline-variant/20">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center gap-2 text-xs font-label uppercase tracking-tighter text-on-surface-variant">
              <span class="material-symbols-outlined text-primary text-lg">verified_user</span> 256-Bit SSL
            </div>
            <div class="flex items-center gap-2 text-xs font-label uppercase tracking-tighter text-on-surface-variant">
              <span class="material-symbols-outlined text-primary text-lg">local_shipping</span> Quick Track
            </div>
            <div class="flex items-center gap-2 text-xs font-label uppercase tracking-tighter text-on-surface-variant">
              <span class="material-symbols-outlined text-primary text-lg">sync</span> 30-Day Returns
            </div>
            <div class="flex items-center gap-2 text-xs font-label uppercase tracking-tighter text-on-surface-variant">
              <span class="material-symbols-outlined text-primary text-lg">support_agent</span> 24/7 Support
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
