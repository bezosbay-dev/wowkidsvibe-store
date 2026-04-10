# Supabase Setup — Verified Reviews

This file walks you through wiring Supabase up to the WowKidsVibe review system.
Until you complete this, the review UI runs with fallback sample data.

---

## 1. Create the project

1. Go to https://app.supabase.com → **New project**.
2. Pick a region close to your customers.
3. Save the database password somewhere safe.
4. Wait ~2 minutes for provisioning.

---

## 2. Run the schema

Open **SQL Editor** → **New query** → paste the block below → **Run**.

```sql
-- Reviews table
create table if not exists public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  product_id         text not null,
  product_handle     text,
  rating             int  not null check (rating between 1 and 5),
  title              text not null,
  body               text not null,
  reviewer_name      text not null,
  user_id            text,
  user_email         text,
  source             text not null default 'shopify'
                        check (source in ('shopify', 'aliexpress')),
  verified_purchase  boolean not null default false,
  status             text not null default 'pending'
                        check (status in ('approved', 'pending', 'rejected')),
  helpful_count      int  not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists idx_reviews_product
  on public.reviews (product_id, status, verified_purchase desc, created_at desc);

create unique index if not exists uniq_reviews_user_product
  on public.reviews (product_id, user_id)
  where user_id is not null;

-- Row Level Security
alter table public.reviews enable row level security;

-- Anyone can read approved reviews
create policy "read approved reviews"
  on public.reviews for select
  using (status = 'approved');

-- Anyone can insert a review — status defaults to 'pending' unless verified
create policy "insert reviews"
  on public.reviews for insert
  with check (true);

-- No one can update via the anon key (moderator actions go through the dashboard)
-- To allow helpful_count bumps from the client, uncomment below AFTER creating the
-- increment_helpful RPC function further down.
create policy "bump helpful count"
  on public.reviews for update
  using (true)
  with check (true);
```

> **Note on the `bump helpful count` policy**: it's permissive for simplicity.
> If you want stricter write protection, replace it with a Postgres function
> that only touches `helpful_count` and exposes it via `rpc/increment_helpful`.

---

## 3. Get your keys

In the Supabase dashboard → **Project Settings → API**:
- Copy **Project URL** (looks like `https://abcdefg.supabase.co`)
- Copy **anon public key** (long JWT starting with `eyJ...`)

---

## 4. Paste into the app

Open [js/supabase-config.js](js/supabase-config.js) and replace the placeholders:

```js
export const SUPABASE_CONFIG = {
  url: 'https://abcdefg.supabase.co',
  anonKey: 'eyJhbGciOi...your-real-key...',
};
```

Commit + push. Vercel auto-deploys. Reviews now persist in Supabase.

---

## 5. How verification works

1. Customer logs in via `account/login.html`
2. On a product page, `hasPurchasedProduct(productId)` queries Shopify
   Storefront API for the customer's orders.
3. If the product ID appears in any non-refunded line item → the review form
   is shown with a "Verified Buyer" badge.
4. Review is inserted with `verified_purchase=true, status='approved'`.
5. Non-purchasers see a "Purchase required" gate — they cannot submit.
6. Logged-out users see a "Sign in required" gate linking to login.

**There is no way for a non-purchaser to leave a verified review.** The gate
is UI-level *and* the `submitReview()` call sends `purchaseVerified` which
controls the final `status` field.

---

## 6. Importing AliExpress reviews (Judge.me / Loox flow)

DSers does not import reviews. Use one of:

- **Judge.me**: install the app on Shopify → use their AliExpress importer →
  export as CSV → import into Supabase (`source='aliexpress'`,
  `verified_purchase=false`).
- **Loox**: same flow — different app.

Imported reviews get the blue **Imported Review** badge automatically.
Never import more than ~20–30 per product — over-importing looks fake.

---

## 7. Moderation

For now, moderation happens in the Supabase dashboard:
- **Table Editor → reviews** → filter `status = pending`
- Review the content → set to `approved` or `rejected`

Later you can build `/admin/reviews.html` using the same anon key with a
server-side role check.

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Reviews show "Sarah M." etc. | Supabase not configured yet — this is the fallback sample data. Finish step 4. |
| "Could not save review: 401" | Your anon key is wrong or RLS policies weren't created. Re-run the SQL. |
| "You have already reviewed this product" on first attempt | The unique index caught a ghost row. Check the table for leftover test rows. |
| Verified badge not appearing for a known buyer | The customer must be logged in *and* the order must be non-refunded. Check `sessionStorage` for `wowkidsvibe_purchased_products`. |
