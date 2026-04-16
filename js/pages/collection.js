import { getCollectionByHandle } from '../api/collections.js';
import { getProducts } from '../api/products.js';
import { renderProductCard, setupAddToCartButtons } from '../components/product-card.js';
import { collectionCardSkeleton } from '../components/skeleton.js';
import { CATEGORIES, findCategory } from '../categories.js';

let currentHandle = 'all';
let currentCategory = 'all';
let currentSort = 'BEST_SELLING';
let currentReverse = false;

export async function initCollectionPage() {
  const params = new URLSearchParams(window.location.search);
  currentHandle = params.get('handle') || 'all';
  currentCategory = params.get('category') || 'all';

  renderCategoryPills();
  setupSortDropdown();
  updateHeader();
  await loadProducts();
}

function renderCategoryPills() {
  const wrap = document.getElementById('category-pills');
  if (!wrap) return;

  wrap.innerHTML = CATEGORIES.map(c => {
    const active = c.key === currentCategory ? 'active' : '';
    const emoji = c.emoji ? `<span class="pill-emoji">${c.emoji}</span>` : '';
    return `<button class="cat-pill ${active}" data-category="${c.key}">${emoji}<span>${c.label}</span></button>`;
  }).join('');

  wrap.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.category;
      if (key === currentCategory) return;

      currentCategory = key;

      wrap.querySelectorAll('.cat-pill').forEach(b =>
        b.classList.toggle('active', b.dataset.category === key)
      );

      const url = new URL(window.location.href);
      if (key === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', key);

      url.searchParams.delete('handle');
      window.history.replaceState({}, '', url);

      currentHandle = 'all';

      updateHeader();
      loadProducts();
    });
  });
}

function updateHeader() {
  const cat = findCategory(currentCategory);
  const titleEl = document.getElementById('collection-title');
  const crumbEl = document.getElementById('crumb-current');

  if (currentCategory === 'all') {
    if (titleEl) titleEl.innerHTML = 'Curated <span class="text-primary">Kinetic</span> Joy';
    if (crumbEl) crumbEl.textContent = 'Shop All';
  } else {
    if (titleEl) titleEl.innerHTML = `${cat.emoji} <span class="text-primary">${cat.label}</span>`;
    if (crumbEl) crumbEl.textContent = cat.label;
  }
}

async function loadProducts() {
  const grid = document.getElementById('collection-grid');
  if (!grid) return;

  grid.innerHTML = collectionCardSkeleton(8);

  try {
    let edges = [];

    // 🔥 FIX: ALWAYS LOAD ALL PRODUCTS (NO FILTER LIMIT BUG)
    if (currentHandle !== 'all') {
      const collection = await getCollectionByHandle(currentHandle, {
        first: 50,
        sortKey: currentSort,
        reverse: currentReverse,
      });

      if (collection && collection.products && collection.products.edges) {
        edges = collection.products.edges;
      }

    } else {
      const result = await getProducts({
        first: 50,
        sortKey: currentSort,
        reverse: currentReverse,
        query: '', // 🔥 no filter
      });

      edges = (result && result.edges) ? result.edges : [];
    }

    const products = edges.map(e => e.node);

    console.log('Products loaded:', products.length);

    const countEl = document.getElementById('product-count');
    if (countEl) {
      countEl.textContent = `Showing ${products.length} item${products.length === 1 ? '' : 's'}`;
    }

    if (products.length === 0) {
      grid.innerHTML = '<p class="col-span-full text-center py-20">No products found.</p>';
      return;
    }

    const cards = products.map(p => renderProductCard(p, 'collection')).join('');
    grid.innerHTML = cards;

    setupAddToCartButtons(grid);

  } catch (err) {
    console.error('Collection load error:', err);
    grid.innerHTML = '<p class="col-span-full text-center py-20">Failed to load products.</p>';
  }
}

function setupSortDropdown() {
  const sel = document.getElementById('sort-select');
  if (!sel) return;

  sel.addEventListener('change', () => {
    switch (sel.value) {
      case 'best-selling': currentSort = 'BEST_SELLING'; currentReverse = false; break;
      case 'price-low':    currentSort = 'PRICE';        currentReverse = false; break;
      case 'price-high':   currentSort = 'PRICE';        currentReverse = true;  break;
      case 'newest':       currentSort = 'CREATED';      currentReverse = true;  break;
      case 'title-az':     currentSort = 'TITLE';        currentReverse = false; break;
    }

    loadProducts();
  });
}