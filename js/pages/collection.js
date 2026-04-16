import { getCollectionByHandle } from '../api/collections.js';
import { getProducts } from '../api/products.js';
import { renderProductCard, setupAddToCartButtons } from '../components/product-card.js';
import { collectionCardSkeleton } from '../components/skeleton.js';
import { CATEGORIES, findCategory, buildCategoryQuery } from '../categories.js';

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
      wrap.querySelectorAll('.cat-pill').forEach(b => b.classList.toggle('active', b.dataset.category === key));

      const url = new URL(window.location.href);
      if (key === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', key);
      url.searchParams.delete('handle');
      window.history.replaceState({}, '', url);
      currentHandle = 'all';

      updateHeader();
      loadProducts();

      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  });

  const activeEl = wrap.querySelector('.cat-pill.active');
  if (activeEl) activeEl.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
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

    if (currentCategory !== 'all') {
      const query = buildCategoryQuery(currentCategory);
      const result = await getProducts({
        first: 250,
        sortKey: currentSort,
        reverse: currentReverse,
        query,
      });
      edges = (result && result.edges) ? result.edges : [];
    } else if (currentHandle === 'all') {
      const result = await getProducts({
        first: 250,
        sortKey: currentSort,
        reverse: currentReverse,
        query: '',
      });
      edges = (result && result.edges) ? result.edges : [];
    } else {
      const collection = await getCollectionByHandle(currentHandle, {
        first: 250,
        sortKey: currentSort,
        reverse: currentReverse,
      });
      if (collection && collection.products && collection.products.edges) {
        edges = collection.products.edges;
        const titleEl = document.getElementById('collection-title');
        const crumbEl = document.getElementById('crumb-current');
        if (titleEl) titleEl.innerHTML = `Curated <span class="text-primary">${collection.title}</span>`;
        if (crumbEl) crumbEl.textContent = collection.title;
      }
    }

    const products = edges.map(function (e) { return e.node; });
    console.log('Products:', products.length);

    const countEl = document.getElementById('product-count');
    if (countEl) {
      countEl.textContent = `Showing ${products.length} item${products.length === 1 ? '' : 's'}`;
    }

    if (products.length === 0) {
      grid.innerHTML = '<p class="col-span-full text-center text-on-surface-variant py-20 font-headline">No products found.</p>';
    } else {
      const cards = products.map(function (p) { return renderProductCard(p, 'collection'); }).join('');
      grid.innerHTML = cards;
      setupAddToCartButtons(grid);
    }

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

  } catch (err) {
    console.error('Collection load error:', err);
    grid.innerHTML = '<p class="col-span-full text-center text-on-surface-variant py-20">Failed to load products. Please try again.</p>';
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
