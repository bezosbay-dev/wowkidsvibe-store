import { getProducts, getProductsByHandles } from '../api/products.js';
import { getCollections } from '../api/collections.js';
import { renderProductCard, setupAddToCartButtons } from '../components/product-card.js';
import { productCardSkeleton } from '../components/skeleton.js';
import { CATEGORIES } from '../categories.js';
import { getFeaturedHandles } from '../api/featured-products.js';

export async function initHomePage() {
  renderCategoryRow();
  loadTrendingProducts();
  loadCollections();
  setupCountdownTimer();
  setupScrollAnimations();
}

function renderCategoryRow() {
  const row = document.getElementById('category-row');
  if (!row) return;
  row.innerHTML = CATEGORIES.filter(c => c.key !== 'all').map(c =>
    `<a class="cat-card" href="collection.html?category=${c.key}">
       <span class="cat-emoji">${c.emoji}</span>
       <span class="cat-label">${c.label}</span>
     </a>`
  ).join('');
}

async function loadTrendingProducts() {
  const grid = document.getElementById('trending-products-grid');
  if (!grid) return;

  grid.innerHTML = productCardSkeleton(4);

  try {
    let homepageProducts = [];
    // Admin-curated featured handles take precedence over Shopify best-sellers.
    try {
      const featured = await getFeaturedHandles();
      if (featured && featured.length) {
        homepageProducts = await getProductsByHandles(featured.slice(0, 8));
      }
    } catch (e) { console.warn('featured fetch failed, falling back:', e); }

    if (!homepageProducts.length) {
      const result = await getProducts({ first: 50, sortKey: 'BEST_SELLING' });
      const allProducts = result.edges.map(function (e) { return e.node; });
      homepageProducts = allProducts.slice(0, 8);
    }
    console.log('Products:', homepageProducts.length);
    const cards = homepageProducts.map(function (p) { return renderProductCard(p, 'default'); }).join('');
    grid.innerHTML = cards;
    setupAddToCartButtons(grid);
    setupScrollAnimations();
  } catch (err) {
    console.error('Home trending load error:', err);
  }
}

async function loadCollections() {
  const grid = document.getElementById('vibe-collections');
  if (!grid) return;

  try {
    const collections = await getCollections(4);
    // Update collection links with real handles
    const links = grid.querySelectorAll('[data-collection-link]');
    collections.forEach((col, i) => {
      if (links[i]) {
        links[i].href = `collection.html?handle=${col.handle}`;
        if (col && col.image && col.image.url) {
          const img = links[i].querySelector('img');
          if (img) img.src = col.image.url;
        }
      }
    });
  } catch (err) {
    console.error('Collections load error:', err);
  }
}

function setupCountdownTimer() {
  const flashTimer = document.getElementById('flash-sale-timer');
  if (!flashTimer) return;

  let totalSeconds = 4 * 3600 + 12 * 60 + 55;
  const hourEl = flashTimer.querySelector('[data-hours]');
  const minEl = flashTimer.querySelector('[data-mins]');
  const secEl = flashTimer.querySelector('[data-secs]');

  if (!hourEl || !minEl || !secEl) return;

  setInterval(() => {
    if (totalSeconds <= 0) return;
    totalSeconds--;
    hourEl.textContent = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    minEl.textContent = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    secEl.textContent = (totalSeconds % 60).toString().padStart(2, '0');
  }, 1000);
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}
