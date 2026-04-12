import { getCart, getDiscountTier, getCheckoutUrl } from '../api/cart.js';
import { predictiveSearch } from '../api/search.js';
import { formatMoney } from '../api/client.js';

let searchTimeout = null;

// Compute base path so links work from any subdirectory (account/, pages/)
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/account/') || path.includes('/pages/')) return '../';
  return '';
}

export function initHeader() {
  const el = document.querySelector('[data-component="header"]');
  if (!el) return;

  el.innerHTML = renderHeader();
  setupCartBadge();
  setupMobileMenu();
  setupSearch();
  setupScrollAnimation();
}

function renderHeader() {
  const b = getBasePath();
  return `
    <!-- Fixed Header Wrapper — full width, single unit -->
    <div class="fixed top-0 left-0 w-full z-50" id="header-wrapper">
      <!-- Announcement Bar -->
      <div class="w-full bg-primary text-on-primary font-label text-xs uppercase tracking-widest">
        <div class="max-w-[1200px] mx-auto px-4 py-1.5 flex items-center justify-center gap-2 sm:gap-6 flex-wrap">
          <span>Flash Sale: Up to 40% Off Storewide</span>
          <div class="flex items-center gap-2 bg-on-primary/10 px-3 py-0.5 rounded-full">
            <span class="opacity-70">Ends In:</span>
            <span class="font-bold" id="countdown-timer">04:12:55</span>
          </div>
        </div>
      </div>

      <!-- Nav Bar — full width, fixed 64px height, no style changes on scroll -->
      <nav class="w-full bg-white/95 backdrop-blur-xl" id="main-nav" style="box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <div class="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between flex-nowrap">
          <!-- Left: Logo -->
          <a href="${b}index.html" class="font-extrabold tracking-tighter text-[#FF4D6D] font-headline whitespace-nowrap flex-shrink-0" style="font-size:clamp(1.15rem,2.5vw,1.5rem);">
            WowKidsVibe
          </a>

          <!-- Center: Nav Links (desktop) -->
          <div class="hidden md:flex items-center gap-6 font-headline font-bold text-sm lg:text-base flex-shrink-0">
            <a class="text-zinc-600 hover:text-[#FF4D6D] transition-colors whitespace-nowrap" href="${b}collection.html?handle=all">Shop All</a>
            <a class="text-zinc-600 hover:text-[#FF4D6D] transition-colors whitespace-nowrap" href="${b}collection.html?handle=new-arrivals">New Arrivals</a>
            <a class="text-zinc-600 hover:text-[#FF4D6D] transition-colors whitespace-nowrap" href="${b}collection.html?handle=best-sellers">Best Sellers</a>
          </div>

          <!-- Right: Search + Icons -->
          <div class="flex items-center gap-3 flex-shrink-0 flex-nowrap">
            <!-- Desktop Search -->
            <div class="relative hidden lg:block">
              <div class="flex items-center bg-gray-100 rounded-full px-3 py-1.5">
                <span class="material-symbols-outlined text-gray-400 text-sm mr-2">search</span>
                <input id="header-search" class="bg-transparent border-none focus:ring-0 text-sm w-40 xl:w-48 placeholder-gray-400" placeholder="Search..." type="text" autocomplete="off" />
              </div>
              <div id="search-dropdown" class="search-dropdown absolute top-full mt-2 right-0 w-80 bg-white rounded-xl overflow-hidden z-50" style="box-shadow:0 20px 40px -10px rgba(0,0,0,0.15);">
                <div id="search-results" class="p-4"></div>
              </div>
            </div>

            <!-- Mobile Search -->
            <button class="lg:hidden w-9 h-9 flex items-center justify-center text-zinc-700 flex-shrink-0" id="mobile-search-btn">
              <span class="material-symbols-outlined text-[22px]">search</span>
            </button>

            <!-- Account -->
            <a href="${b}account/login.html" class="w-9 h-9 flex items-center justify-center text-zinc-700 flex-shrink-0">
              <span class="material-symbols-outlined text-[22px]">person</span>
            </a>

            <!-- Cart -->
            <button class="w-9 h-9 flex items-center justify-center text-zinc-700 relative flex-shrink-0" id="cart-toggle">
              <span class="material-symbols-outlined text-[22px]">shopping_cart</span>
              <span id="cart-badge" class="absolute -top-0.5 -right-0.5 bg-primary text-on-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold hidden">0</span>
            </button>

            <!-- Mobile Menu Toggle -->
            <button class="md:hidden w-9 h-9 flex items-center justify-center text-zinc-700 flex-shrink-0" id="mobile-menu-toggle">
              <span class="material-symbols-outlined text-[22px]">menu</span>
            </button>
          </div>
        </div>
      </nav>
    </div>

    <!-- Mobile Menu -->
    <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/30 z-[55] cart-overlay" style="display:none;"></div>
    <div id="mobile-menu" class="fixed top-0 left-0 w-80 h-full bg-background z-[56] mobile-menu overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-8">
          <a href="${b}index.html" class="text-2xl font-extrabold tracking-tighter text-[#FF4D6D] font-headline">WowKidsVibe</a>
          <button id="mobile-menu-close" class="p-2">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="mb-6">
          <div class="flex items-center bg-surface-container-highest/30 rounded-xl px-4 py-3">
            <span class="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
            <input id="mobile-search-input" class="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-on-surface-variant/50" placeholder="Search products..." type="text" />
          </div>
        </div>
        <nav class="space-y-1">
          <a class="block py-3 px-4 font-headline font-bold text-lg text-on-surface hover:text-[#FF4D6D] hover:bg-surface-container-low rounded-xl transition-all" href="${b}collection.html?handle=all">Shop All</a>
          <a class="block py-3 px-4 font-headline font-bold text-lg text-on-surface hover:text-[#FF4D6D] hover:bg-surface-container-low rounded-xl transition-all" href="${b}collection.html?handle=new-arrivals">New Arrivals</a>
          <a class="block py-3 px-4 font-headline font-bold text-lg text-on-surface hover:text-[#FF4D6D] hover:bg-surface-container-low rounded-xl transition-all" href="${b}collection.html?handle=best-sellers">Best Sellers</a>
          <a class="block py-3 px-4 font-headline font-bold text-lg text-on-surface hover:text-[#FF4D6D] hover:bg-surface-container-low rounded-xl transition-all" href="${b}about.html">About Us</a>
          <a class="block py-3 px-4 font-headline font-bold text-lg text-on-surface hover:text-[#FF4D6D] hover:bg-surface-container-low rounded-xl transition-all" href="${b}contact.html">Contact</a>
          <a class="block py-3 px-4 font-headline font-bold text-lg text-on-surface hover:text-[#FF4D6D] hover:bg-surface-container-low rounded-xl transition-all" href="${b}order-tracking.html">Track Order</a>
        </nav>
        <div class="mt-8 pt-8 border-t border-outline-variant/20 space-y-3">
          <a class="flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary transition-colors" href="${b}account/login.html">
            <span class="material-symbols-outlined">person</span> My Account
          </a>
          <a class="flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary transition-colors" href="${b}cart.html">
            <span class="material-symbols-outlined">shopping_cart</span> Cart
          </a>
        </div>
      </div>
    </div>

    <!-- Cart Drawer -->
    <div id="cart-overlay" class="fixed inset-0 bg-black/30 z-[70] cart-overlay" style="display:none;"></div>
    <div id="cart-drawer" class="fixed top-0 right-0 w-full max-w-md h-full bg-background z-[71] cart-drawer overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-headline font-extrabold">Your Cart</h2>
          <button id="cart-close" class="p-2 hover:scale-105 transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div id="cart-drawer-content">
          <div class="text-center py-16 text-on-surface-variant">
            <span class="material-symbols-outlined text-6xl mb-4 block">shopping_cart</span>
            <p class="font-headline font-bold text-lg">Your cart is empty</p>
            <p class="text-sm mt-2">Start shopping to add items</p>
            <a href="${b}collection.html?handle=all" class="inline-block mt-6 px-8 py-3 kinetic-gradient text-white rounded-full font-headline font-bold hover:scale-[1.02] transition-all">Shop Now</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupCartBadge() {
  window.addEventListener('cart:updated', (e) => {
    const cart = e.detail;
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    if (cart && cart.totalQuantity > 0) {
      badge.textContent = cart.totalQuantity;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
    renderCartDrawer(cart);
  });

  // Load cart on init
  getCart().catch(() => {});

  // Cart toggle
  document.getElementById('cart-toggle')?.addEventListener('click', () => {
    toggleCartDrawer(true);
  });
  document.getElementById('cart-close')?.addEventListener('click', () => {
    toggleCartDrawer(false);
  });
  document.getElementById('cart-overlay')?.addEventListener('click', () => {
    toggleCartDrawer(false);
  });
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (!drawer || !overlay) return;

  if (open) {
    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      drawer.classList.add('open');
    });
    document.body.style.overflow = 'hidden';
  } else {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.style.display = 'none'; }, 350);
  }
}

export function openCartDrawer() {
  toggleCartDrawer(true);
}

function renderCartDrawer(cart) {
  const container = document.getElementById('cart-drawer-content');
  if (!container) return;

  const b = getBasePath();

  if (!cart || !cart.lines.edges.length) {
    container.innerHTML = `
      <div class="text-center py-16 text-on-surface-variant">
        <span class="material-symbols-outlined text-6xl mb-4 block">shopping_cart</span>
        <p class="font-headline font-bold text-lg">Your cart is empty</p>
        <p class="text-sm mt-2">Start shopping to add items</p>
        <a href="${b}collection.html?handle=all" class="inline-block mt-6 px-8 py-3 kinetic-gradient text-white rounded-full font-headline font-bold hover:scale-[1.02] transition-all">Shop Now</a>
      </div>
    `;
    return;
  }

  const tier = getDiscountTier(cart.totalQuantity);
  let discountedSubtotal = 0;

  const lines = cart.lines.edges.map(({ node }) => {
    const m = node.merchandise;
    const originalPrice = parseFloat(m.price.amount);
    const discountedPrice = Math.round(originalPrice * (1 - tier.discount) * 100) / 100;
    discountedSubtotal += Math.round(discountedPrice * node.quantity * 100) / 100;

    return `
      <div class="flex gap-4 py-4 border-b border-outline-variant/10">
        <a href="${b}product.html?handle=${m.product.handle}" class="w-20 h-20 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0">
          ${m.image ? `<img src="${m.image.url}" alt="${m.image.altText || m.product.title}" class="w-full h-full object-cover" loading="lazy" />` : ''}
        </a>
        <div class="flex-1 min-w-0">
          <a href="${b}product.html?handle=${m.product.handle}" class="font-headline font-bold text-sm hover:text-primary transition-colors line-clamp-1">${m.product.title}</a>
          <p class="text-xs text-on-surface-variant mt-0.5">${m.selectedOptions.map(o => o.value).join(' / ')}</p>
          <div class="flex justify-between items-end mt-2">
            <div class="flex items-center bg-surface-container rounded-full p-0.5">
              <button class="cart-qty-btn w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-sm" data-line-id="${node.id}" data-action="decrease">-</button>
              <span class="px-2 font-headline font-bold text-sm">${node.quantity}</span>
              <button class="cart-qty-btn w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-sm" data-line-id="${node.id}" data-action="increase" data-qty="${node.quantity}">+</button>
            </div>
            <div class="text-right">
              <span class="text-xs text-outline line-through block">${formatMoney(originalPrice)}</span>
              <span class="font-headline font-bold text-sm">${formatMoney(discountedPrice)}</span>
            </div>
          </div>
        </div>
        <button class="cart-remove-btn self-start text-outline-variant hover:text-error transition-colors" data-line-id="${node.id}">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="space-y-0">${lines}</div>
    <div class="mt-6 space-y-3">
      <div class="flex justify-between text-on-surface-variant text-sm">
        <span>Subtotal</span>
        <span class="font-bold text-on-surface">${formatMoney(discountedSubtotal)}</span>
      </div>
      <div class="flex items-center justify-center gap-1 text-green-600 text-xs font-bold">
        <span class="material-symbols-outlined text-sm">local_offer</span>
        ${Math.round(tier.discount * 100)}% OFF applied
      </div>
      <p class="text-xs text-on-surface-variant">Shipping & taxes calculated at checkout</p>
      <a href="${getCheckoutUrl(cart)}" class="block w-full py-4 kinetic-gradient text-white rounded-full font-headline font-bold text-center hover:scale-[1.02] transition-all shadow-lg">
        Checkout
      </a>
      <a href="${b}cart.html" class="block w-full py-3 bg-surface-container text-on-surface rounded-full font-headline font-bold text-center hover:bg-surface-container-high transition-all">
        View Cart
      </a>
    </div>
  `;

  // Quantity buttons
  container.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const lineId = btn.dataset.lineId;
      const action = btn.dataset.action;
      const { updateCartLine, removeCartLine } = await import('../api/cart.js');
      if (action === 'decrease') {
        const qty = parseInt(btn.nextElementSibling.textContent);
        if (qty <= 1) {
          await removeCartLine(lineId);
        } else {
          await updateCartLine(lineId, qty - 1);
        }
      } else {
        const qty = parseInt(btn.dataset.qty);
        await updateCartLine(lineId, qty + 1);
      }
    });
  });

  // Remove buttons
  container.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { removeCartLine } = await import('../api/cart.js');
      await removeCartLine(btn.dataset.lineId);
    });
  });
}

function setupMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const close = document.getElementById('mobile-menu-close');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');

  function openMenu() {
    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      menu.classList.add('open');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('open');
    menu.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.style.display = 'none'; }, 350);
  }

  toggle?.addEventListener('click', openMenu);
  close?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
}

function setupSearch() {
  const input = document.getElementById('header-search');
  const dropdown = document.getElementById('search-dropdown');
  const resultsContainer = document.getElementById('search-results');
  const b = getBasePath();

  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = input.value.trim();
    if (query.length < 2) {
      dropdown.classList.remove('open');
      return;
    }
    searchTimeout = setTimeout(async () => {
      try {
        const results = await predictiveSearch(query);
        if (results.products.length === 0) {
          resultsContainer.innerHTML = '<p class="text-sm text-on-surface-variant">No products found</p>';
        } else {
          resultsContainer.innerHTML = results.products.map(p => `
            <a href="${b}product.html?handle=${p.handle}" class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors">
              <div class="w-12 h-12 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0">
                ${p.featuredImage ? `<img src="${p.featuredImage.url}" alt="${p.featuredImage.altText || p.title}" class="w-full h-full object-cover" loading="lazy" />` : ''}
              </div>
              <div>
                <p class="font-headline font-bold text-sm">${p.title}</p>
                <p class="text-xs text-primary font-bold">${formatMoney(p.priceRange.minVariantPrice.amount)}</p>
              </div>
            </a>
          `).join('') + `
            <a href="${b}search.html?q=${encodeURIComponent(query)}" class="block text-center py-3 mt-2 text-primary font-headline font-bold text-sm hover:underline">
              View all results
            </a>
          `;
        }
        dropdown.classList.add('open');
      } catch {
        dropdown.classList.remove('open');
      }
    }, 300);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) window.location.href = `${b}search.html?q=${encodeURIComponent(query)}`;
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#header-search') && !e.target.closest('#search-dropdown')) {
      dropdown?.classList.remove('open');
    }
  });

  // Mobile search redirect
  const mobileSearchBtn = document.getElementById('mobile-search-btn');
  mobileSearchBtn?.addEventListener('click', () => {
    window.location.href = `${b}search.html`;
  });

  const mobileSearchInput = document.getElementById('mobile-search-input');
  mobileSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = mobileSearchInput.value.trim();
      if (query) window.location.href = `${b}search.html?q=${encodeURIComponent(query)}`;
    }
  });
}

function setupScrollAnimation() {
  // Countdown timer
  let totalSeconds = 4 * 3600 + 12 * 60 + 55;
  const timerEl = document.getElementById('countdown-timer');
  if (timerEl) {
    setInterval(() => {
      if (totalSeconds <= 0) return;
      totalSeconds--;
      const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      timerEl.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  // Scroll-reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}
