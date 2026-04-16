import { searchProducts } from '../api/search.js';
import { renderProductCard, setupAddToCartButtons } from '../components/product-card.js';
import { productCardSkeleton } from '../components/skeleton.js';

export async function initSearchPage() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = query;

  if (query) await performSearch(query);

  const form = document.getElementById('search-form');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) {
      window.history.replaceState({}, '', `search.html?q=${encodeURIComponent(q)}`);
      performSearch(q);
    }
  });
}

async function performSearch(query) {
  const grid = document.getElementById('search-results-grid');
  const titleEl = document.getElementById('search-title');
  const countEl = document.getElementById('search-count');

  if (!grid) return;
  grid.innerHTML = productCardSkeleton(4);
  if (titleEl) titleEl.innerHTML = `Results for "<span class="text-primary">${query}</span>"`;

  try {
    const results = await searchProducts(query, 20);

    if (countEl) countEl.textContent = `${results.totalCount} products found`;

    if (results.edges.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-20">
          <span class="material-symbols-outlined text-8xl text-on-surface-variant/30 mb-6 block">search_off</span>
          <h2 class="font-headline font-extrabold text-2xl mb-3">No results found</h2>
          <p class="text-on-surface-variant mb-8">Try a different search term or browse our collections.</p>
          <a href="collection.html?handle=all" class="inline-block px-8 py-3 kinetic-gradient text-white rounded-full font-headline font-bold hover:scale-[1.02] transition-all">Browse All Products</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = results.edges.map(({ node }) => renderProductCard(node, 'default')).join('');
    setupAddToCartButtons(grid);
  } catch {
    grid.innerHTML = '<p class="col-span-full text-center py-20 text-on-surface-variant">Search failed. Please try again.</p>';
  }
}
