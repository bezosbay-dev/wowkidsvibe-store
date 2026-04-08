import { getProductByHandle, getProductRecommendations } from '../api/products.js';
import { addToCart } from '../api/cart.js';
import { formatMoney } from '../api/client.js';
import { showToast } from '../components/toast.js';
import { openCartDrawer } from '../components/header.js';

let currentProduct = null;
let selectedVariant = null;
let quantity = 1;

export async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const handle = params.get('handle');

  console.log('[ProductPage] handle from URL:', handle);

  if (!handle) {
    window.location.href = 'collection.html?handle=all';
    return;
  }

  const container = document.getElementById('product-detail');
  if (!container) {
    console.error('[ProductPage] #product-detail container not found');
    return;
  }

  // Show skeleton while loading
  container.innerHTML = skeletonHTML();

  try {
    console.log('[ProductPage] Fetching product by handle:', handle);
    currentProduct = await getProductByHandle(handle);
    console.log('[ProductPage] API response:', currentProduct);

    if (!currentProduct) {
      container.innerHTML = `
        <div class="text-center py-20">
          <span class="material-symbols-outlined text-8xl text-on-surface-variant/30 mb-6 block">search_off</span>
          <h2 class="font-headline font-extrabold text-2xl mb-3">Product not found</h2>
          <p class="text-on-surface-variant mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <a href="collection.html?handle=all" class="inline-block px-8 py-3 kinetic-gradient text-white rounded-full font-headline font-bold hover:scale-[1.02] transition-all">Browse All Products</a>
        </div>
      `;
      return;
    }

    document.title = currentProduct.title + ' — WowKidsVibe';
    renderProduct(container);
    loadRecommendations();

  } catch (err) {
    console.error('[ProductPage] Error loading product:', err);
    container.innerHTML = `
      <div class="text-center py-20">
        <span class="material-symbols-outlined text-8xl text-error/30 mb-6 block">error</span>
        <h2 class="font-headline font-extrabold text-2xl mb-3">Failed to load product</h2>
        <p class="text-on-surface-variant mb-8">${err.message || 'Please try again later.'}</p>
        <a href="collection.html?handle=all" class="inline-block px-8 py-3 kinetic-gradient text-white rounded-full font-headline font-bold hover:scale-[1.02] transition-all">Browse All Products</a>
      </div>
    `;
  }
}

function renderProduct(container) {
  const p = currentProduct;
  const images = p.images.edges.map(e => e.node);
  const variants = p.variants.edges.map(e => e.node);
  selectedVariant = variants[0];
  quantity = 1;

  const mainImage = selectedVariant.image || images[0];
  const price = selectedVariant.price;
  const compareAt = selectedVariant.compareAtPrice;
  const hasDiscount = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount);
  const discountPercent = hasDiscount
    ? Math.round((1 - parseFloat(price.amount) / parseFloat(compareAt.amount)) * 100)
    : 0;

  // Update breadcrumb
  const breadcrumb = document.getElementById('product-breadcrumb');
  if (breadcrumb) breadcrumb.textContent = p.title;

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      <!-- ===== Gallery ===== -->
      <div class="lg:col-span-6 space-y-4">
        <div class="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low">
          <img id="main-image" class="w-full h-full object-cover transition-opacity duration-300" src="${mainImage?.url || ''}" alt="${mainImage?.altText || p.title}" />
          ${p.tags?.includes('new') ? '<div class="absolute top-4 left-4"><span class="bg-tertiary-container text-on-tertiary-container font-label text-[10px] font-bold px-3 py-1 rounded-full">NEW ARRIVAL</span></div>' : ''}
        </div>
        ${images.length > 1 ? `
        <div class="grid grid-cols-4 gap-3">
          ${images.slice(0, 8).map(function(img, i) {
            return '<button class="thumb-btn aspect-square rounded-xl overflow-hidden ' + (i === 0 ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80') + ' transition-all" data-index="' + i + '"><img class="w-full h-full object-cover" src="' + img.url + '" alt="' + (img.altText || '') + '" loading="lazy" /></button>';
          }).join('')}
        </div>
        ` : ''}
      </div>

      <!-- ===== Details ===== -->
      <div class="lg:col-span-6 space-y-6">
        <!-- Title & Rating -->
        <header class="space-y-4">
          <h1 class="text-3xl lg:text-4xl font-headline font-extrabold tracking-tight leading-tight text-on-surface">${p.title}</h1>
          <div class="flex items-center gap-3">
            <div class="flex text-[#C49B00]">
              ${'<span class="material-symbols-outlined text-sm" style="font-variation-settings: \'FILL\' 1;">star</span>'.repeat(5)}
            </div>
            <span class="text-sm font-medium text-on-surface-variant">4.9/5</span>
          </div>
        </header>

        <!-- Pricing -->
        <div class="bg-surface-container-lowest p-6 rounded-2xl soft-shadow">
          <div class="flex items-center gap-4 flex-wrap">
            <span id="variant-price" class="text-4xl font-headline font-extrabold ${hasDiscount ? 'text-error' : 'text-on-surface'}">${formatMoney(price.amount, price.currencyCode)}</span>
            ${hasDiscount ? `
              <span id="variant-compare-price" class="text-xl text-on-surface-variant line-through">${formatMoney(compareAt.amount, compareAt.currencyCode)}</span>
              <span class="bg-primary-container text-on-primary-container font-label font-bold text-xs px-3 py-1 rounded-full">SAVE ${discountPercent}%</span>
            ` : ''}
          </div>
          ${selectedVariant.availableForSale === false ? '<p class="text-error font-bold mt-2">Out of Stock</p>' : ''}
        </div>

        <!-- Urgency -->
        <div class="space-y-2">
          <div class="flex items-center gap-3 p-3 bg-tertiary-container/20 rounded-xl text-tertiary text-sm font-medium">
            <span class="material-symbols-outlined text-lg">visibility</span>
            <span>${Math.floor(Math.random() * 20 + 5)} people viewing this right now</span>
          </div>
          ${selectedVariant.quantityAvailable != null && selectedVariant.quantityAvailable > 0 && selectedVariant.quantityAvailable < 20 ? `
          <div class="flex items-center gap-3 p-3 bg-error-container/20 rounded-xl text-error text-sm font-medium">
            <span class="material-symbols-outlined text-lg">inventory_2</span>
            <span>Only ${selectedVariant.quantityAvailable} left in stock!</span>
          </div>` : ''}
        </div>

        <!-- Variant Options -->
        ${p.options.filter(function(o) { return o.name !== 'Title'; }).map(function(option) {
          return '<div class="space-y-3"><h3 class="font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em]">' + option.name + '</h3><div class="flex flex-wrap gap-2">' + option.values.map(function(val, i) {
            return '<button class="option-btn px-5 py-2.5 rounded-full font-headline font-bold text-sm transition-all ' + (i === 0 ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest') + '" data-option-name="' + option.name + '" data-option-value="' + val + '">' + val + '</button>';
          }).join('') + '</div></div>';
        }).join('')}

        <!-- Quantity -->
        <div class="space-y-3">
          <h3 class="font-label text-xs font-bold text-on-surface-variant uppercase tracking-[0.15em]">Quantity</h3>
          <div class="inline-flex items-center bg-surface-container-high rounded-full p-1">
            <button id="qty-decrease" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors font-headline font-bold text-lg">−</button>
            <span id="qty-value" class="px-5 font-headline font-bold text-lg min-w-[3rem] text-center">1</span>
            <button id="qty-increase" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors font-headline font-bold text-lg">+</button>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3 pt-4">
          <button id="add-to-cart-main" class="w-full coral-button text-white font-headline font-extrabold py-5 rounded-full text-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] transition-all ${selectedVariant.availableForSale === false ? 'opacity-50 cursor-not-allowed' : ''}" ${selectedVariant.availableForSale === false ? 'disabled' : ''}>
            <span class="material-symbols-outlined">shopping_bag</span> ADD TO CART
          </button>
          <button id="buy-now-btn" class="w-full bg-on-surface text-background font-headline font-extrabold py-5 rounded-full text-xl hover:bg-black transition-all ${selectedVariant.availableForSale === false ? 'opacity-50 cursor-not-allowed' : ''}" ${selectedVariant.availableForSale === false ? 'disabled' : ''}>
            BUY IT NOW
          </button>
        </div>

        <!-- Trust Badges -->
        <div class="grid grid-cols-3 gap-4 pt-6 border-t border-outline-variant/20">
          <div class="flex flex-col items-center gap-2 text-center">
            <span class="material-symbols-outlined text-primary text-2xl">local_shipping</span>
            <span class="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Free Shipping</span>
          </div>
          <div class="flex flex-col items-center gap-2 text-center">
            <span class="material-symbols-outlined text-primary text-2xl">replay</span>
            <span class="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">30-Day Returns</span>
          </div>
          <div class="flex flex-col items-center gap-2 text-center">
            <span class="material-symbols-outlined text-primary text-2xl">verified_user</span>
            <span class="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Safe Checkout</span>
          </div>
        </div>

        <!-- Description -->
        ${p.descriptionHtml ? `
        <div class="pt-6 border-t border-outline-variant/20">
          <details open>
            <summary class="flex justify-between items-center cursor-pointer font-headline font-bold text-lg mb-4">
              About this product
              <span class="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div class="prose prose-sm text-on-surface-variant font-body max-w-none">${p.descriptionHtml}</div>
          </details>
        </div>` : ''}
      </div>
    </div>
  `;

  setupGallery(images);
  setupVariantOptions(variants);
  setupQuantity();
  setupAddToCart();
}

// ── Gallery thumbnail clicks ──
function setupGallery(images) {
  const mainImg = document.getElementById('main-image');
  if (!mainImg) return;

  document.querySelectorAll('.thumb-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(btn.dataset.index);
      if (images[idx]) {
        mainImg.src = images[idx].url;
        mainImg.alt = images[idx].altText || '';
      }
      document.querySelectorAll('.thumb-btn').forEach(function(b) {
        b.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      });
      btn.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    });
  });
}

// ── Variant option selector ──
function setupVariantOptions(variants) {
  var selectedOptions = {};
  currentProduct.options.forEach(function(opt) {
    selectedOptions[opt.name] = opt.values[0];
  });

  document.querySelectorAll('.option-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var name = btn.dataset.optionName;
      var value = btn.dataset.optionValue;
      selectedOptions[name] = value;

      // Update button styles for this option group
      document.querySelectorAll('.option-btn[data-option-name="' + name + '"]').forEach(function(b) {
        b.classList.remove('bg-primary', 'text-on-primary', 'shadow-md');
        b.classList.add('bg-surface-container-high', 'text-on-surface');
      });
      btn.classList.remove('bg-surface-container-high', 'text-on-surface');
      btn.classList.add('bg-primary', 'text-on-primary', 'shadow-md');

      // Find matching variant
      var match = variants.find(function(v) {
        return v.selectedOptions.every(function(o) {
          return selectedOptions[o.name] === o.value;
        });
      });

      if (match) {
        selectedVariant = match;
        updatePriceDisplay(match);
        if (match.image) {
          document.getElementById('main-image').src = match.image.url;
        }
        // Update add-to-cart button state
        var atcBtn = document.getElementById('add-to-cart-main');
        var buyBtn = document.getElementById('buy-now-btn');
        if (match.availableForSale === false) {
          if (atcBtn) { atcBtn.disabled = true; atcBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
          if (buyBtn) { buyBtn.disabled = true; buyBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
        } else {
          if (atcBtn) { atcBtn.disabled = false; atcBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
          if (buyBtn) { buyBtn.disabled = false; buyBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
        }
      }
    });
  });
}

function updatePriceDisplay(variant) {
  var priceEl = document.getElementById('variant-price');
  if (priceEl) {
    priceEl.textContent = formatMoney(variant.price.amount, variant.price.currencyCode);
  }
  var compareEl = document.getElementById('variant-compare-price');
  if (compareEl) {
    if (variant.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)) {
      compareEl.textContent = formatMoney(variant.compareAtPrice.amount, variant.compareAtPrice.currencyCode);
      compareEl.style.display = '';
    } else {
      compareEl.style.display = 'none';
    }
  }
}

// ── Quantity selector ──
function setupQuantity() {
  var qtyVal = document.getElementById('qty-value');
  var decBtn = document.getElementById('qty-decrease');
  var incBtn = document.getElementById('qty-increase');

  if (!qtyVal || !decBtn || !incBtn) return;

  decBtn.addEventListener('click', function() {
    if (quantity > 1) {
      quantity--;
      qtyVal.textContent = quantity;
    }
  });

  incBtn.addEventListener('click', function() {
    if (quantity < 99) {
      quantity++;
      qtyVal.textContent = quantity;
    }
  });
}

// ── Add to Cart & Buy Now ──
function setupAddToCart() {
  var atcBtn = document.getElementById('add-to-cart-main');
  if (atcBtn) {
    atcBtn.addEventListener('click', async function() {
      if (!selectedVariant || !selectedVariant.availableForSale) return;
      atcBtn.disabled = true;
      atcBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Adding...';

      try {
        await addToCart(selectedVariant.id, quantity);
        showToast('Added to cart!', 'success');
        openCartDrawer();
      } catch (err) {
        console.error('[ProductPage] Add to cart error:', err);
        showToast('Failed to add to cart', 'error');
      } finally {
        atcBtn.disabled = false;
        atcBtn.innerHTML = '<span class="material-symbols-outlined">shopping_bag</span> ADD TO CART';
      }
    });
  }

  var buyBtn = document.getElementById('buy-now-btn');
  if (buyBtn) {
    buyBtn.addEventListener('click', async function() {
      if (!selectedVariant || !selectedVariant.availableForSale) return;
      buyBtn.disabled = true;
      buyBtn.textContent = 'Processing...';

      try {
        var cart = await addToCart(selectedVariant.id, quantity);
        if (cart && cart.checkoutUrl) {
          window.location.href = cart.checkoutUrl;
        }
      } catch (err) {
        console.error('[ProductPage] Buy now error:', err);
        showToast('Failed to proceed to checkout', 'error');
        buyBtn.disabled = false;
        buyBtn.textContent = 'BUY IT NOW';
      }
    });
  }
}

// ── Related Products ──
async function loadRecommendations() {
  var grid = document.getElementById('related-products');
  if (!grid || !currentProduct) return;

  try {
    var recs = await getProductRecommendations(currentProduct.id);
    if (!recs || recs.length === 0) {
      var section = document.getElementById('related-section');
      if (section) section.style.display = 'none';
      return;
    }

    grid.innerHTML = recs.slice(0, 4).map(function(p) {
      var recPrice = p.priceRange.minVariantPrice;
      var recCompare = p.compareAtPriceRange ? p.compareAtPriceRange.minVariantPrice : null;
      var recHasDiscount = recCompare && parseFloat(recCompare.amount) > parseFloat(recPrice.amount);

      return '<a href="/product.html?handle=' + p.handle + '" class="group block">' +
        '<div class="aspect-square rounded-2xl bg-surface-container-low overflow-hidden mb-4 relative">' +
          (p.featuredImage ? '<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="' + p.featuredImage.url + '" alt="' + (p.featuredImage.altText || p.title) + '" loading="lazy" />' : '') +
        '</div>' +
        '<h3 class="font-headline font-bold text-sm mb-1 line-clamp-2">' + p.title + '</h3>' +
        '<div class="flex items-center gap-2">' +
          '<span class="text-primary font-headline font-extrabold">' + formatMoney(recPrice.amount, recPrice.currencyCode) + '</span>' +
          (recHasDiscount ? '<span class="text-xs text-on-surface-variant line-through">' + formatMoney(recCompare.amount, recCompare.currencyCode) + '</span>' : '') +
        '</div>' +
      '</a>';
    }).join('');

  } catch (err) {
    console.error('[ProductPage] Recommendations error:', err);
    var section = document.getElementById('related-section');
    if (section) section.style.display = 'none';
  }
}

// ── Loading Skeleton ──
function skeletonHTML() {
  return '<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-pulse">' +
    '<div class="lg:col-span-6 space-y-4">' +
      '<div class="aspect-square skeleton rounded-2xl"></div>' +
      '<div class="grid grid-cols-4 gap-3">' +
        '<div class="aspect-square skeleton rounded-xl"></div>'.repeat(4) +
      '</div>' +
    '</div>' +
    '<div class="lg:col-span-6 space-y-6">' +
      '<div class="skeleton h-10 w-3/4 rounded-xl"></div>' +
      '<div class="skeleton h-6 w-1/3 rounded-lg"></div>' +
      '<div class="skeleton h-24 w-full rounded-2xl"></div>' +
      '<div class="skeleton h-12 w-full rounded-2xl"></div>' +
      '<div class="skeleton h-16 w-full rounded-full"></div>' +
      '<div class="skeleton h-16 w-full rounded-full"></div>' +
    '</div>' +
  '</div>';
}
