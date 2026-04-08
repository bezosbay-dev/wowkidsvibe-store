import { getCollectionByHandle } from '../api/collections.js';
import { getProducts } from '../api/products.js';
import { renderProductCard, setupAddToCartButtons } from '../components/product-card.js';
import { collectionCardSkeleton } from '../components/skeleton.js';

let currentHandle = 'all';
let currentSort = 'BEST_SELLING';
let currentReverse = false;
let endCursor = null;
let hasNextPage = false;
let isAllProducts = false;

export async function initCollectionPage() {
  const params = new URLSearchParams(window.location.search);
  currentHandle = params.get('handle') || 'all';

  setupSortControls();
  await loadProducts();
  setupLoadMore();
}

async function loadProducts(append = false) {
  const grid = document.getElementById('collection-grid');
  if (!grid) return;

  if (!append) {
    grid.innerHTML = collectionCardSkeleton(6);
    endCursor = null;
  }

  try {
    // Try collection first; fall back to all-products query for "all" or if not found
    let edges, pageInfo, title;

    if (currentHandle === 'all' || isAllProducts) {
      isAllProducts = true;
      const result = await getProducts({
        first: 12,
        after: append ? endCursor : null,
        sortKey: currentSort,
        reverse: currentReverse,
        query: '',
      });
      edges = result.edges;
      pageInfo = result.pageInfo;
      title = 'All Products';
    } else {
      const collection = await getCollectionByHandle(currentHandle, {
        first: 12,
        after: append ? endCursor : null,
        sortKey: currentSort,
        reverse: currentReverse,
      });

      if (!collection) {
        // Collection handle not found — fall back to all products
        isAllProducts = true;
        const result = await getProducts({
          first: 12,
          after: append ? endCursor : null,
          sortKey: currentSort,
          reverse: currentReverse,
          query: '',
        });
        edges = result.edges;
        pageInfo = result.pageInfo;
        title = 'All Products';
      } else {
        edges = collection.products.edges;
        pageInfo = collection.products.pageInfo;
        title = collection.title;
      }
    }

    // Update page title
    const titleEl = document.getElementById('collection-title');
    if (titleEl && !append) {
      titleEl.innerHTML = `Curated <span class="text-primary">${title}</span>`;
    }

    const countEl = document.getElementById('product-count');
    if (countEl) countEl.textContent = `Showing ${edges.length} Premium Items`;

    hasNextPage = pageInfo.hasNextPage;
    endCursor = pageInfo.endCursor;

    const cards = edges
      .map(({ node }) => renderProductCard(node, 'collection'))
      .join('');

    if (append) {
      grid.insertAdjacentHTML('beforeend', cards);
    } else {
      grid.innerHTML = cards;
    }

    setupAddToCartButtons(grid);

    // Show/hide load more
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = hasNextPage ? 'inline-flex' : 'none';
    }

    // Animate new cards
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

  } catch (err) {
    if (!append) {
      grid.innerHTML = '<p class="col-span-full text-center text-on-surface-variant py-20">Failed to load products. Please try again.</p>';
    }
  }
}

function setupSortControls() {
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('text-primary', 'border-primary'));
      btn.classList.add('text-primary', 'border-primary');
      const sort = btn.dataset.sort;
      switch (sort) {
        case 'best-selling': currentSort = 'BEST_SELLING'; currentReverse = false; break;
        case 'price-low': currentSort = 'PRICE'; currentReverse = false; break;
        case 'price-high': currentSort = 'PRICE'; currentReverse = true; break;
        case 'newest': currentSort = 'CREATED'; currentReverse = true; break;
        case 'title-az': currentSort = 'TITLE'; currentReverse = false; break;
      }
      loadProducts();
    });
  });
}

function setupLoadMore() {
  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    loadProducts(true);
  });
}
