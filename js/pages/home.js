import { getProducts } from '../api/products.js';
import { getCollections } from '../api/collections.js';
import { renderProductCard, setupAddToCartButtons } from '../components/product-card.js';
import { productCardSkeleton } from '../components/skeleton.js';
import { CATEGORIES } from '../categories.js';

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
    const products = await getProducts({ first: 12, sortKey: 'BEST_SELLING' });
    const cards = products.edges.map(({ node }) => renderProductCard(node, 'default')).join('');
    grid.innerHTML = cards;
    setupAddToCartButtons(grid);
    setupScrollAnimations();
  } catch {
    // Keep static fallback content if API fails
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
        if (col.image?.url) {
          const img = links[i].querySelector('img');
          if (img) img.src = col.image.url;
        }
      }
    });
  } catch {
    // Keep static fallback
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
