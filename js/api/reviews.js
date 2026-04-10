// Reviews API — talks to Supabase REST (PostgREST) directly from the browser
// using the public anon key. Row Level Security in Supabase enforces what each
// user can read/write.
//
// Falls back to in-memory sample reviews when Supabase isn't configured yet so
// the UI stays functional during setup.

import { SUPABASE_CONFIG, SUPABASE_ENABLED, REVIEWS_TABLE } from '../supabase-config.js';

const SAMPLE_REVIEWS = [
  { id: 's1', reviewer_name: 'Sarah M.', rating: 5, title: 'Absolutely love it!',        body: 'My daughter adores this. Quality is excellent and shipping was faster than expected. Will definitely order again.',       source: 'shopify',    verified_purchase: true,  helpful_count: 24, created_at: daysAgo(14) },
  { id: 's2', reviewer_name: 'Mike T.',  rating: 5, title: 'Exceeded expectations',      body: 'Bought this as a gift for my nephew and everyone was impressed with the quality. Great value for the price.',              source: 'shopify',    verified_purchase: true,  helpful_count: 18, created_at: daysAgo(32) },
  { id: 's3', reviewer_name: 'Priya K.', rating: 4, title: 'Really good product',        body: 'Exactly as described. Took a tiny bit longer to arrive than expected but the product itself is fantastic.',                  source: 'shopify',    verified_purchase: true,  helpful_count: 11, created_at: daysAgo(38) },
  { id: 's4', reviewer_name: 'Jessica R.', rating: 5, title: 'Best purchase this year',  body: 'I\'ve bought from many stores but the quality here is noticeably better. Packaging was beautiful too!',                       source: 'aliexpress', verified_purchase: false, helpful_count: 9,  created_at: daysAgo(62) },
  { id: 's5', reviewer_name: 'David L.',   rating: 5, title: 'Highly recommend',         body: 'Works perfectly, looks premium, and my kids haven\'t put it down since it arrived. 10/10.',                                    source: 'aliexpress', verified_purchase: false, helpful_count: 7,  created_at: daysAgo(68) },
  { id: 's6', reviewer_name: 'Amanda F.',  rating: 4, title: 'Really nice',              body: 'Good quality and the design is very cute. One small scratch on arrival but customer service handled it great.',               source: 'aliexpress', verified_purchase: false, helpful_count: 4,  created_at: daysAgo(90) },
  { id: 's7', reviewer_name: 'Kevin H.',   rating: 5, title: 'Perfect gift',             body: 'Ordered for my daughter\'s birthday. She was thrilled. Highly recommend this store.',                                           source: 'aliexpress', verified_purchase: false, helpful_count: 3,  created_at: daysAgo(95) },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
  };
}

function sbUrl(path) {
  return `${SUPABASE_CONFIG.url}/rest/v1/${path}`;
}

// Public: fetch reviews for a product, sorted verified → imported → newest
export async function fetchReviews(productId) {
  if (!SUPABASE_ENABLED) {
    return SAMPLE_REVIEWS.slice();
  }
  const url = sbUrl(
    `${REVIEWS_TABLE}?product_id=eq.${encodeURIComponent(productId)}` +
    `&status=eq.approved` +
    `&order=verified_purchase.desc,created_at.desc` +
    `&limit=50`
  );
  try {
    const res = await fetch(url, { headers: sbHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('fetchReviews failed, using fallback:', e);
    return SAMPLE_REVIEWS.slice();
  }
}

// Public: aggregate stats for the summary card
export async function fetchReviewStats(productId) {
  const reviews = await fetchReviews(productId);
  if (reviews.length === 0) {
    return { overall: 0, total: 0, breakdown: [5,4,3,2,1].map(s => ({ stars: s, pct: 0 })) };
  }
  const total = reviews.length;
  const sum = reviews.reduce((a, r) => a + Number(r.rating), 0);
  const counts = { 5:0, 4:0, 3:0, 2:0, 1:0 };
  reviews.forEach(r => { counts[Number(r.rating)] = (counts[Number(r.rating)] || 0) + 1; });
  const breakdown = [5,4,3,2,1].map(s => ({
    stars: s,
    pct: Math.round((counts[s] / total) * 100),
  }));
  return {
    overall: Math.round((sum / total) * 10) / 10,
    total,
    breakdown,
  };
}

// Public: anti-spam client-side validation. Returns null if OK, error string if bad.
// Server-side RLS + triggers should re-validate — never trust client.
export function validateReview({ rating, title, body, reviewerName }) {
  if (!rating || rating < 1 || rating > 5) return 'Please select a star rating';
  if (!reviewerName || reviewerName.trim().length < 2) return 'Please enter your name';
  if (!title || title.trim().length < 3) return 'Please add a short title';
  if (!body || body.trim().length < 20) return 'Please write at least 20 characters';
  if (body.length > 2000) return 'Review is too long (max 2000 characters)';

  const text = (title + ' ' + body).toLowerCase();
  // No links allowed
  if (/https?:\/\/|www\.|\.com\b|\.net\b|\.shop\b/i.test(text)) return 'Links are not allowed in reviews';
  // Block obvious spam phrases
  const SPAM = ['click here', 'buy now from', 'whatsapp', 'telegram', 'crypto', 'bitcoin', 'viagra', 'casino', 'free gift card', 'check my profile'];
  for (const phrase of SPAM) {
    if (text.includes(phrase)) return 'Your review contains prohibited content';
  }
  return null;
}

// Public: submit a verified review. `purchaseVerified` must come from a real
// Shopify orders query — never pass `true` unless you confirmed it server-side-ish.
export async function submitReview({
  productId,
  productHandle,
  rating,
  title,
  body,
  reviewerName,
  userId,
  userEmail,
  purchaseVerified,
}) {
  const err = validateReview({ rating, title, body, reviewerName });
  if (err) throw new Error(err);

  const row = {
    product_id: productId,
    product_handle: productHandle || null,
    rating: Number(rating),
    title: title.trim(),
    body: body.trim(),
    reviewer_name: reviewerName.trim(),
    user_id: userId || null,
    user_email: userEmail || null,
    source: 'shopify',
    verified_purchase: !!purchaseVerified,
    status: purchaseVerified ? 'approved' : 'pending',
    helpful_count: 0,
  };

  if (!SUPABASE_ENABLED) {
    // Dev mode: prepend to the in-memory list so the UI still works
    SAMPLE_REVIEWS.unshift({ id: 'local-' + Date.now(), ...row, created_at: new Date().toISOString() });
    return row;
  }

  // Dedupe guard: same user + product
  if (userId) {
    const dupeUrl = sbUrl(`${REVIEWS_TABLE}?product_id=eq.${encodeURIComponent(productId)}&user_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`);
    try {
      const dres = await fetch(dupeUrl, { headers: sbHeaders() });
      if (dres.ok) {
        const existing = await dres.json();
        if (Array.isArray(existing) && existing.length > 0) {
          throw new Error('You have already reviewed this product');
        }
      }
    } catch (e) {
      if (e.message && e.message.includes('already reviewed')) throw e;
    }
  }

  const res = await fetch(sbUrl(REVIEWS_TABLE), {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error('Could not save review: ' + (msg || res.status));
  }
  const saved = await res.json();
  return Array.isArray(saved) ? saved[0] : saved;
}

// Public: bump helpful counter. Uses a tiny RPC-style PATCH — for a real prod
// setup, create a Postgres function `increment_helpful(review_id uuid)` and call
// it via /rest/v1/rpc/increment_helpful. This PATCH version works with a
// permissive RLS policy that allows `helpful_count` updates only.
export async function markHelpful(reviewId, currentCount) {
  if (!SUPABASE_ENABLED || String(reviewId).startsWith('s') || String(reviewId).startsWith('local-')) {
    return (currentCount || 0) + 1;
  }
  try {
    const res = await fetch(sbUrl(`${REVIEWS_TABLE}?id=eq.${reviewId}`), {
      method: 'PATCH',
      headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify({ helpful_count: (currentCount || 0) + 1 }),
    });
    if (!res.ok) return currentCount || 0;
    const updated = await res.json();
    return Array.isArray(updated) && updated[0] ? updated[0].helpful_count : (currentCount || 0) + 1;
  } catch {
    return (currentCount || 0) + 1;
  }
}

// Public: relative time formatter ("2 weeks ago")
export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const SEC = 1000, MIN = 60*SEC, HOUR = 60*MIN, DAY = 24*HOUR, WEEK = 7*DAY, MONTH = 30*DAY, YEAR = 365*DAY;
  if (diff < MIN)   return 'just now';
  if (diff < HOUR)  return Math.floor(diff/MIN)   + 'm ago';
  if (diff < DAY)   return Math.floor(diff/HOUR)  + 'h ago';
  if (diff < WEEK)  return Math.floor(diff/DAY)   + 'd ago';
  if (diff < MONTH) return Math.floor(diff/WEEK)  + 'w ago';
  if (diff < YEAR)  return Math.floor(diff/MONTH) + 'mo ago';
  return Math.floor(diff/YEAR) + 'y ago';
}
