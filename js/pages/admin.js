// Admin dashboard page module — vanilla JS, no SPA framework. Renders one of
// two screens depending on session state: login form or dashboard with four
// tabs (Reviews / Videos / Featured / Banner).

import { signIn, signOut, isAdmin } from '../api/admin-auth.js';
import {
  listAllReviews, updateReview, deleteReview,
  listVideos, addVideo, updateVideo, deleteVideo,
  listFeatured, addFeatured, removeFeatured,
  getBannerAdmin, updateBanner,
  searchShopifyProducts,
} from '../api/admin-content.js';
import { showToast } from '../components/toast.js';
import { SUPABASE_ENABLED } from '../supabase-config.js';

const TABS = [
  { key: 'reviews',  label: 'Reviews',  icon: 'rate_review' },
  { key: 'videos',   label: 'Videos',   icon: 'play_circle' },
  { key: 'featured', label: 'Featured', icon: 'star' },
  { key: 'banner',   label: 'Banner',   icon: 'campaign' },
];

let activeTab = 'reviews';

export async function initAdminPage() {
  const root = document.getElementById('admin-root');
  if (!root) return;

  if (!SUPABASE_ENABLED) {
    root.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div class="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-3">Supabase not configured</h1>
          <p class="text-gray-600 mb-4 text-sm">Fill in <code class="bg-gray-100 px-1.5 py-0.5 rounded">js/supabase-config.js</code> with your project URL and anon key, then run <code class="bg-gray-100 px-1.5 py-0.5 rounded">supabase/setup.sql</code>.</p>
          <p class="text-xs text-gray-500">See <code>SUPABASE_SETUP.md</code> for the full walkthrough.</p>
        </div>
      </div>`;
    return;
  }

  if (await isAdmin()) renderDashboard(root);
  else renderLogin(root);
}

// ─── Login ────────────────────────────────────────────────────────────
function renderLogin(root) {
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-indigo-50 p-6">
      <form id="login-form" class="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div class="text-center mb-2">
          <div class="text-2xl font-extrabold text-gray-900">WoowFinds Admin</div>
          <div class="text-xs text-gray-500 mt-1">Authorized personnel only</div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Email</label>
          <input id="login-email" type="email" required autocomplete="email"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Password</label>
          <input id="login-password" type="password" required autocomplete="current-password"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none" />
        </div>
        <div id="login-error" class="text-sm text-red-600 hidden"></div>
        <button type="submit" id="login-btn"
          class="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2.5 rounded-lg transition">
          Sign in
        </button>
      </form>
    </div>`;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');
    errEl.classList.add('hidden');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      await signIn(email, password);
      renderDashboard(root);
    } catch (err) {
      errEl.textContent = err.message === 'Not authorized'
        ? 'This email is not authorized.'
        : 'Wrong email or password.';
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  });
}

// ─── Dashboard shell ──────────────────────────────────────────────────
function renderDashboard(root) {
  root.innerHTML = `
    <div class="flex min-h-screen bg-gray-50 text-gray-900">
      <aside class="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div class="px-5 py-5 border-b border-gray-100">
          <div class="font-extrabold text-lg">WoowFinds</div>
          <div class="text-xs text-gray-500">Admin Dashboard</div>
        </div>
        <nav class="flex-1 p-3 space-y-1">
          ${TABS.map(t => `
            <button data-tab="${t.key}" class="admin-tab w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
              <span class="material-symbols-outlined text-[20px]">${t.icon}</span>
              ${t.label}
            </button>
          `).join('')}
        </nav>
        <button id="logout-btn" class="m-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">logout</span> Sign out
        </button>
      </aside>
      <main id="admin-content" class="flex-1 overflow-auto p-6"></main>
    </div>`;

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut();
    renderLogin(root);
  });

  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  switchTab(activeTab);
}

function switchTab(key) {
  activeTab = key;
  document.querySelectorAll('.admin-tab').forEach(b => {
    const isActive = b.dataset.tab === key;
    b.classList.toggle('bg-pink-50',     isActive);
    b.classList.toggle('text-pink-700',  isActive);
    b.classList.toggle('font-semibold',  isActive);
  });
  const main = document.getElementById('admin-content');
  if (key === 'reviews')  return renderReviewsTab(main);
  if (key === 'videos')   return renderVideosTab(main);
  if (key === 'featured') return renderFeaturedTab(main);
  if (key === 'banner')   return renderBannerTab(main);
}

// ─── Reviews tab ──────────────────────────────────────────────────────
async function renderReviewsTab(main) {
  main.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <div class="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold">Reviews</h1>
          <p class="text-sm text-gray-500">Approve, edit, or delete user-submitted reviews.</p>
        </div>
        <div class="flex gap-2">
          <select id="rev-status" class="px-3 py-2 rounded-lg border border-gray-300 text-sm">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="spam">Spam</option>
            <option value="rejected">Rejected</option>
          </select>
          <input id="rev-handle" placeholder="Filter by product handle" class="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
          <button id="rev-refresh" class="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm">Refresh</button>
        </div>
      </div>
      <div id="rev-list" class="space-y-3"><div class="text-sm text-gray-500">Loading…</div></div>
    </div>`;

  const refresh = async () => {
    const status = document.getElementById('rev-status').value || null;
    const handle = document.getElementById('rev-handle').value.trim() || null;
    const listEl = document.getElementById('rev-list');
    listEl.innerHTML = '<div class="text-sm text-gray-500">Loading…</div>';
    try {
      const rows = await listAllReviews({ status, productHandle: handle });
      if (!rows || rows.length === 0) {
        listEl.innerHTML = '<div class="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">No reviews match this filter.</div>';
        return;
      }
      listEl.innerHTML = rows.map(reviewRowHtml).join('');
      listEl.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => handleReviewAction(btn, refresh));
      });
    } catch (e) {
      listEl.innerHTML = `<div class="text-sm text-red-600">Failed: ${e.message}</div>`;
    }
  };

  document.getElementById('rev-refresh').addEventListener('click', refresh);
  document.getElementById('rev-status').addEventListener('change', refresh);
  document.getElementById('rev-handle').addEventListener('keydown', e => { if (e.key === 'Enter') refresh(); });
  refresh();
}

function reviewRowHtml(r) {
  const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
  const statusClasses = {
    pending:  'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100  text-green-800',
    spam:     'bg-red-100    text-red-800',
    rejected: 'bg-gray-200   text-gray-700',
  }[r.status] || 'bg-gray-100 text-gray-700';
  return `
    <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-3" data-id="${r.id}">
      <div class="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div class="font-semibold text-sm">${escapeHtml(r.reviewer_name)} · <span class="text-amber-500">${stars}</span></div>
          <div class="text-xs text-gray-500 mt-0.5">handle: <span class="font-mono">${escapeHtml(r.product_handle || '—')}</span> · ${new Date(r.created_at).toLocaleString()}</div>
        </div>
        <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses}">${r.status}</span>
      </div>
      <input data-field="title" value="${escapeAttr(r.title)}" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold" />
      <textarea data-field="body" rows="3" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">${escapeHtml(r.body)}</textarea>
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2 text-xs">
          <label class="flex items-center gap-1">Rating
            <select data-field="rating" class="border border-gray-200 rounded px-2 py-1">
              ${[5,4,3,2,1].map(n => `<option value="${n}" ${n===r.rating?'selected':''}>${n}</option>`).join('')}
            </select>
          </label>
          <label class="flex items-center gap-1">Status
            <select data-field="status" class="border border-gray-200 rounded px-2 py-1">
              ${['pending','approved','spam','rejected'].map(s => `<option value="${s}" ${s===r.status?'selected':''}>${s}</option>`).join('')}
            </select>
          </label>
          <label class="flex items-center gap-1">
            <input type="checkbox" data-field="verified_purchase" ${r.verified_purchase?'checked':''} /> verified
          </label>
        </div>
        <div class="flex gap-2">
          <button data-action="save"   class="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-sm">Save</button>
          <button data-action="delete" class="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-800 text-sm">Delete</button>
        </div>
      </div>
    </div>`;
}

async function handleReviewAction(btn, refresh) {
  const card = btn.closest('[data-id]');
  const id = card.dataset.id;
  if (btn.dataset.action === 'delete') {
    if (!confirm('Delete this review?')) return;
    try { await deleteReview(id); showToast('Deleted', 'success'); refresh(); }
    catch (e) { showToast(e.message, 'error'); }
    return;
  }
  if (btn.dataset.action === 'save') {
    const patch = {
      title:             card.querySelector('[data-field="title"]').value.trim(),
      body:              card.querySelector('[data-field="body"]').value.trim(),
      rating:            Number(card.querySelector('[data-field="rating"]').value),
      status:            card.querySelector('[data-field="status"]').value,
      verified_purchase: card.querySelector('[data-field="verified_purchase"]').checked,
    };
    try { await updateReview(id, patch); showToast('Saved', 'success'); refresh(); }
    catch (e) { showToast(e.message, 'error'); }
  }
}

// ─── Videos tab ───────────────────────────────────────────────────────
async function renderVideosTab(main) {
  main.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Product Videos</h1>
        <p class="text-sm text-gray-500">Add Instagram Reel or TikTok URLs that show on the product page as customer reviews.</p>
      </div>

      <div class="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <div class="font-semibold text-sm">Add a video</div>
        ${productPickerHtml('video-picker')}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select id="vid-platform" class="px-3 py-2 rounded-lg border border-gray-300 text-sm">
            <option value="instagram">Instagram Reel</option>
            <option value="tiktok">TikTok</option>
          </select>
          <input id="vid-url" placeholder="Paste full URL (https://www.instagram.com/reel/...)" class="px-3 py-2 rounded-lg border border-gray-300 text-sm sm:col-span-2" />
          <input id="vid-caption" placeholder="Caption (optional)" class="px-3 py-2 rounded-lg border border-gray-300 text-sm sm:col-span-2" />
          <input id="vid-order" type="number" placeholder="Order" value="0" class="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
        </div>
        <button id="vid-add" class="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold">Add video</button>
      </div>

      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold text-sm">Existing videos</div>
          <button id="vid-refresh" class="text-xs px-2 py-1 rounded bg-gray-100">Refresh</button>
        </div>
        <div id="vid-list" class="space-y-2"></div>
      </div>
    </div>`;

  let pickedHandle = null;
  let pickedId = null;
  initProductPicker('video-picker', (p) => { pickedHandle = p.handle; pickedId = p.id; });

  const refresh = async () => {
    const list = document.getElementById('vid-list');
    list.innerHTML = '<div class="text-sm text-gray-500">Loading…</div>';
    try {
      const rows = await listVideos();
      list.innerHTML = rows.length === 0
        ? '<div class="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 text-center">No videos yet.</div>'
        : rows.map(videoRowHtml).join('');
      list.querySelectorAll('[data-vid-action]').forEach(btn => {
        btn.addEventListener('click', () => handleVideoAction(btn, refresh));
      });
    } catch (e) {
      list.innerHTML = `<div class="text-sm text-red-600">Failed: ${e.message}</div>`;
    }
  };

  document.getElementById('vid-refresh').addEventListener('click', refresh);
  document.getElementById('vid-add').addEventListener('click', async () => {
    if (!pickedHandle) { showToast('Pick a product first', 'error'); return; }
    const platform = document.getElementById('vid-platform').value;
    const url      = document.getElementById('vid-url').value.trim();
    const caption  = document.getElementById('vid-caption').value.trim();
    const order    = Number(document.getElementById('vid-order').value || 0);
    if (!url) { showToast('Paste a video URL', 'error'); return; }
    try {
      await addVideo({ productHandle: pickedHandle, productId: pickedId, platform, embedUrl: url, caption, displayOrder: order });
      showToast('Added', 'success');
      document.getElementById('vid-url').value = '';
      document.getElementById('vid-caption').value = '';
      refresh();
    } catch (e) { showToast(e.message, 'error'); }
  });
  refresh();
}

function videoRowHtml(v) {
  return `
    <div class="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3" data-id="${v.id}">
      <div class="px-2 py-1 rounded text-xs font-semibold ${v.platform === 'tiktok' ? 'bg-black text-white' : 'bg-pink-100 text-pink-700'}">${v.platform}</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-mono text-gray-700 truncate">${escapeHtml(v.product_handle)}</div>
        <a href="${escapeAttr(v.embed_url)}" target="_blank" class="text-xs text-blue-600 truncate block">${escapeHtml(v.embed_url)}</a>
        ${v.caption ? `<div class="text-xs text-gray-500 truncate">${escapeHtml(v.caption)}</div>` : ''}
      </div>
      <input type="number" data-vid-field="display_order" value="${v.display_order}" class="w-16 px-2 py-1 rounded border border-gray-200 text-xs text-center" />
      <select data-vid-field="status" class="px-2 py-1 rounded border border-gray-200 text-xs">
        <option value="active" ${v.status==='active'?'selected':''}>active</option>
        <option value="hidden" ${v.status==='hidden'?'selected':''}>hidden</option>
      </select>
      <button data-vid-action="save" class="px-2 py-1 rounded bg-gray-900 text-white text-xs">Save</button>
      <button data-vid-action="delete" class="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">Delete</button>
    </div>`;
}

async function handleVideoAction(btn, refresh) {
  const card = btn.closest('[data-id]');
  const id = card.dataset.id;
  if (btn.dataset.vidAction === 'delete') {
    if (!confirm('Delete this video?')) return;
    try { await deleteVideo(id); showToast('Deleted', 'success'); refresh(); }
    catch (e) { showToast(e.message, 'error'); }
    return;
  }
  if (btn.dataset.vidAction === 'save') {
    const patch = {
      display_order: Number(card.querySelector('[data-vid-field="display_order"]').value || 0),
      status:        card.querySelector('[data-vid-field="status"]').value,
    };
    try { await updateVideo(id, patch); showToast('Saved', 'success'); refresh(); }
    catch (e) { showToast(e.message, 'error'); }
  }
}

// ─── Featured tab ─────────────────────────────────────────────────────
async function renderFeaturedTab(main) {
  main.innerHTML = `
    <div class="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Featured Products</h1>
        <p class="text-sm text-gray-500">Curate which products appear in the homepage trending grid. Empty list = falls back to Shopify best-sellers.</p>
      </div>
      <div class="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <div class="font-semibold text-sm">Add product</div>
        ${productPickerHtml('feat-picker')}
        <button id="feat-add" class="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold">Add to featured</button>
      </div>
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold text-sm">Current order</div>
          <button id="feat-refresh" class="text-xs px-2 py-1 rounded bg-gray-100">Refresh</button>
        </div>
        <div id="feat-list" class="space-y-2"></div>
      </div>
    </div>`;

  let picked = null;
  initProductPicker('feat-picker', (p) => { picked = p; });

  const refresh = async () => {
    const list = document.getElementById('feat-list');
    list.innerHTML = '<div class="text-sm text-gray-500">Loading…</div>';
    try {
      const rows = await listFeatured();
      list.innerHTML = rows.length === 0
        ? '<div class="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 text-center">No featured products yet.</div>'
        : rows.map((r, i) => `
          <div class="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3" data-id="${r.id}">
            <span class="text-xs font-semibold w-6 text-center text-gray-500">${i+1}</span>
            <span class="flex-1 font-mono text-sm">${escapeHtml(r.product_handle)}</span>
            <button data-feat-action="delete" class="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">Remove</button>
          </div>`).join('');
      list.querySelectorAll('[data-feat-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.closest('[data-id]').dataset.id;
          if (!confirm('Remove this product from featured?')) return;
          try { await removeFeatured(id); showToast('Removed', 'success'); refresh(); }
          catch (e) { showToast(e.message, 'error'); }
        });
      });
    } catch (e) {
      list.innerHTML = `<div class="text-sm text-red-600">Failed: ${e.message}</div>`;
    }
  };

  document.getElementById('feat-refresh').addEventListener('click', refresh);
  document.getElementById('feat-add').addEventListener('click', async () => {
    if (!picked) { showToast('Pick a product first', 'error'); return; }
    try {
      const order = Date.now() % 100000;
      await addFeatured(picked.handle, order);
      showToast('Added', 'success');
      refresh();
    } catch (e) { showToast(e.message, 'error'); }
  });
  refresh();
}

// ─── Banner tab ───────────────────────────────────────────────────────
async function renderBannerTab(main) {
  main.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Promo Banner</h1>
        <p class="text-sm text-gray-500">The red bar at the top of every page. Disable to hide everywhere instantly.</p>
      </div>
      <div id="banner-form" class="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div class="text-sm text-gray-500">Loading…</div>
      </div>
    </div>`;

  const formEl = document.getElementById('banner-form');
  let current = null;
  try { current = await getBannerAdmin(); } catch (e) { showToast(e.message, 'error'); }
  current = current || { text: '', ends_at: '', enabled: true };

  const endsAtLocal = current.ends_at
    ? new Date(current.ends_at).toISOString().slice(0, 16)
    : '';

  formEl.innerHTML = `
    <label class="block">
      <span class="text-xs font-semibold text-gray-700">Banner text</span>
      <input id="banner-text" value="${escapeAttr(current.text || '')}" class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
    </label>
    <label class="block">
      <span class="text-xs font-semibold text-gray-700">Countdown ends at (local time)</span>
      <input id="banner-ends" type="datetime-local" value="${endsAtLocal}" class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
    </label>
    <label class="inline-flex items-center gap-2">
      <input id="banner-enabled" type="checkbox" ${current.enabled ? 'checked' : ''} />
      <span class="text-sm">Enabled (visible on storefront)</span>
    </label>
    <button id="banner-save" class="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-semibold">Save changes</button>`;

  document.getElementById('banner-save').addEventListener('click', async () => {
    const text    = document.getElementById('banner-text').value.trim();
    const endsRaw = document.getElementById('banner-ends').value;
    const enabled = document.getElementById('banner-enabled').checked;
    const value = {
      text,
      ends_at: endsRaw ? new Date(endsRaw).toISOString() : null,
      enabled,
    };
    try { await updateBanner(value); showToast('Saved', 'success'); }
    catch (e) { showToast(e.message, 'error'); }
  });
}

// ─── Reusable Shopify product picker ──────────────────────────────────
function productPickerHtml(id) {
  return `
    <div class="relative" data-picker="${id}">
      <input data-picker-input placeholder="Search Shopify products…"
        class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
      <div data-picker-results class="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-64 overflow-auto hidden"></div>
      <div data-picker-selected class="text-xs text-gray-600 mt-1 hidden"></div>
    </div>`;
}

function initProductPicker(id, onPick) {
  const root = document.querySelector(`[data-picker="${id}"]`);
  if (!root) return;
  const input    = root.querySelector('[data-picker-input]');
  const results  = root.querySelector('[data-picker-results]');
  const selected = root.querySelector('[data-picker-selected]');
  let timer = null;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { results.classList.add('hidden'); return; }
    timer = setTimeout(async () => {
      try {
        const items = await searchShopifyProducts(q);
        results.innerHTML = items.length === 0
          ? '<div class="px-3 py-2 text-sm text-gray-500">No matches.</div>'
          : items.map(p => `
            <button type="button" data-handle="${escapeAttr(p.handle)}" data-id="${escapeAttr(p.id)}" data-title="${escapeAttr(p.title)}"
              class="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left">
              ${p.featuredImage ? `<img src="${escapeAttr(p.featuredImage.url)}" class="w-8 h-8 rounded object-cover" />` : ''}
              <div class="text-sm">
                <div class="font-medium">${escapeHtml(p.title)}</div>
                <div class="text-xs text-gray-500 font-mono">${escapeHtml(p.handle)}</div>
              </div>
            </button>`).join('');
        results.classList.remove('hidden');
        results.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            input.value = btn.dataset.title;
            selected.textContent = `Selected: ${btn.dataset.handle}`;
            selected.classList.remove('hidden');
            results.classList.add('hidden');
            onPick({ handle: btn.dataset.handle, id: btn.dataset.id, title: btn.dataset.title });
          });
        });
      } catch (e) {
        results.innerHTML = `<div class="px-3 py-2 text-sm text-red-600">${e.message}</div>`;
        results.classList.remove('hidden');
      }
    }, 250);
  });

  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) results.classList.add('hidden');
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(s) {
  return String(s ?? '').replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}
