// PDP "Real customers" video strip — horizontal scroll of Instagram Reels +
// TikTok embeds. Lazy-mounts the embeds via IntersectionObserver so we don't
// pay the cost of N third-party iframes on first paint.

import { parseInstagramReel, parseTikTok } from '../api/product-videos.js';

let _instaLoaded = false;
let _tiktokLoaded = false;

function loadInstagramScript() {
  if (_instaLoaded) return;
  _instaLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.instagram.com/embed.js';
  document.body.appendChild(s);
}

function loadTikTokScript() {
  if (_tiktokLoaded) return;
  _tiktokLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.tiktok.com/embed.js';
  document.body.appendChild(s);
}

function cardSkeleton(video, index) {
  const platformLabel = video.platform === 'tiktok' ? 'TikTok' : 'Instagram';
  const icon = video.platform === 'tiktok'
    ? '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.85-.31-4.06-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.39C1.34 2.69.93 3.36.62 4.15.32 4.91.12 5.79.06 7.06.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.39 2.13.67.67 1.34 1.08 2.13 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.39.67-.67 1.08-1.34 1.39-2.13.3-.76.5-1.64.56-2.91C23.99 15.67 24 15.26 24 12s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.39-2.13C21.31 1.34 20.64.93 19.85.62 19.09.32 18.21.12 16.94.06 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/></svg>';
  return `
    <div
      class="vs-card relative shrink-0 snap-start rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 cursor-pointer"
      style="width:280px;height:500px;"
      data-platform="${video.platform}"
      data-permalink="${video.permalink}"
      data-video-id="${video.videoId || ''}"
      data-index="${index}">
      <div class="vs-placeholder absolute inset-0 flex flex-col items-center justify-center text-gray-700 p-4">
        <div class="text-pink-600 mb-3">${icon}</div>
        <div class="text-sm font-semibold mb-1">${platformLabel} Review</div>
        <div class="text-xs text-gray-500 text-center">Tap to load video</div>
      </div>
      ${video.caption ? `
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white text-xs">
          ${video.caption}
        </div>
      ` : ''}
    </div>
  `;
}

function mountInstagram(card, permalink) {
  card.innerHTML = `
    <blockquote class="instagram-media" data-instgrm-permalink="${permalink}" data-instgrm-version="14"
      style="background:#FFF;border:0;margin:0;width:100%;height:100%;"></blockquote>
  `;
  loadInstagramScript();
  // Re-process when the script is ready
  const tryProcess = () => {
    if (window.instgrm && window.instgrm.embeds) {
      window.instgrm.embeds.process();
    } else {
      setTimeout(tryProcess, 300);
    }
  };
  tryProcess();
}

function mountTikTok(card, permalink, videoId) {
  card.innerHTML = `
    <blockquote class="tiktok-embed" cite="${permalink}" data-video-id="${videoId}"
      style="max-width:100%;min-width:280px;margin:0;">
      <section></section>
    </blockquote>
  `;
  loadTikTokScript();
}

function upgradeCard(card) {
  if (card.dataset.mounted) return;
  card.dataset.mounted = '1';
  const platform = card.dataset.platform;
  const permalink = card.dataset.permalink;
  const videoId = card.dataset.videoId;
  if (platform === 'instagram') mountInstagram(card, permalink);
  else if (platform === 'tiktok') mountTikTok(card, permalink, videoId);
}

export function renderVideoStrip(videos) {
  const valid = (videos || [])
    .map(v => {
      if (v.platform === 'instagram') {
        const parsed = parseInstagramReel(v.embed_url);
        if (!parsed) return null;
        return { platform: 'instagram', permalink: parsed.permalink, videoId: parsed.id, caption: v.caption || '' };
      }
      if (v.platform === 'tiktok') {
        const parsed = parseTikTok(v.embed_url);
        if (!parsed) return null;
        return { platform: 'tiktok', permalink: parsed.permalink, videoId: parsed.id, caption: v.caption || '' };
      }
      return null;
    })
    .filter(Boolean);

  if (valid.length === 0) return '';

  return `
    <section class="my-8 sm:my-12 px-4 sm:px-6 lg:px-12">
      <div class="max-w-7xl mx-auto">
        <div class="mb-4 sm:mb-6">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Real Customers, Real Reviews</h2>
          <p class="text-sm sm:text-base text-gray-600 mt-1">Watch how families are loving this product</p>
        </div>
        <div class="vs-track flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 sm:-mx-0 px-4 sm:px-0"
             style="scrollbar-width:thin;">
          ${valid.map((v, i) => cardSkeleton(v, i)).join('')}
        </div>
      </div>
    </section>
  `;
}

export function activateVideoStrip(rootEl = document) {
  const cards = rootEl.querySelectorAll('.vs-card');
  if (!cards.length) return;

  // Click-to-load — gives the user explicit control and avoids loading 5
  // iframes for someone who just scrolls past the section.
  cards.forEach(card => {
    card.addEventListener('click', () => upgradeCard(card), { once: true });
  });

  // Also auto-upgrade the first card when it scrolls into view, so the
  // section "feels alive" without a tap.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          if (card.dataset.index === '0') upgradeCard(card);
          io.unobserve(card);
        }
      });
    }, { rootMargin: '200px' });
    cards.forEach(c => io.observe(c));
  }
}
