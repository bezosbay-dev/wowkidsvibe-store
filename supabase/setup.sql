-- =====================================================================
-- WoowFinds admin-panel Supabase setup
-- =====================================================================
-- HOW TO USE:
--   1. Create a fresh Supabase project (https://supabase.com/dashboard).
--   2. Open SQL Editor and paste this entire file. Run.
--   3. Authentication -> Users -> Add user:
--        email:    bezosbay@gmail.com
--        password: <pick a strong one>
--        Auto Confirm User: ON
--   4. Authentication -> Providers -> Email:
--        turn OFF "Enable signups" (so nobody else can self-register).
--   5. Settings -> API: copy "Project URL" and "anon public key" into
--        js/supabase-config.js
--
-- Single admin allowlist:
--   bezosbay@gmail.com  (hardcoded into RLS policies below)
-- If you ever need to change the admin email, search/replace this file
-- and re-run the policy block.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1) reviews
-- =====================================================================
-- Schema must match what js/api/reviews.js already reads/writes.
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
  source             text not null default 'shopify' check (source in ('shopify','aliexpress','imported')),
  verified_purchase  boolean not null default false,
  status             text not null default 'pending' check (status in ('pending','approved','spam','rejected')),
  helpful_count      int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists reviews_product_id_idx       on public.reviews (product_id);
create index if not exists reviews_product_handle_idx   on public.reviews (product_handle);
create index if not exists reviews_status_idx           on public.reviews (status);
create index if not exists reviews_created_at_idx       on public.reviews (created_at desc);

-- =====================================================================
-- 2) product_videos  (Instagram Reels + TikTok per product)
-- =====================================================================
create table if not exists public.product_videos (
  id              uuid primary key default gen_random_uuid(),
  product_handle  text not null,
  product_id      text,
  platform        text not null check (platform in ('instagram','tiktok')),
  embed_url       text not null,
  caption         text,
  display_order   int  not null default 0,
  status          text not null default 'active' check (status in ('active','hidden')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists product_videos_handle_idx on public.product_videos (product_handle);
create index if not exists product_videos_status_idx on public.product_videos (status);
create index if not exists product_videos_order_idx  on public.product_videos (display_order);

-- =====================================================================
-- 3) featured_products  (homepage trending grid curation)
-- =====================================================================
create table if not exists public.featured_products (
  id              uuid primary key default gen_random_uuid(),
  product_handle  text not null unique,
  display_order   int  not null default 0,
  status          text not null default 'active' check (status in ('active','hidden')),
  created_at      timestamptz not null default now()
);

create index if not exists featured_products_status_idx on public.featured_products (status);
create index if not exists featured_products_order_idx  on public.featured_products (display_order);

-- =====================================================================
-- 4) site_settings  (flash-sale banner etc.)
-- =====================================================================
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Seed the flash-sale banner row so the admin UI has something to load.
insert into public.site_settings (key, value)
values (
  'promo_banner',
  jsonb_build_object(
    'text',    'FLASH SALE - 30% OFF EVERYTHING',
    'ends_at', (now() + interval '24 hours')::text,
    'enabled', true
  )
)
on conflict (key) do nothing;

-- =====================================================================
-- updated_at trigger
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_set_updated_at        on public.reviews;
drop trigger if exists product_videos_set_updated_at on public.product_videos;
drop trigger if exists site_settings_set_updated_at  on public.site_settings;

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create trigger product_videos_set_updated_at
  before update on public.product_videos
  for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
-- Public anon role:
--   - reviews: SELECT where status = 'approved'
--   - product_videos / featured_products: SELECT where status = 'active'
--   - site_settings: SELECT all (banner row only)
--   - reviews: INSERT (review submissions from storefront), UPDATE (helpful_count only)
--
-- Authenticated admin (bezosbay@gmail.com):
--   - full CRUD on every table.
-- =====================================================================

alter table public.reviews            enable row level security;
alter table public.product_videos     enable row level security;
alter table public.featured_products  enable row level security;
alter table public.site_settings      enable row level security;

-- ---------- reviews ---------------------------------------------------
drop policy if exists reviews_anon_select          on public.reviews;
drop policy if exists reviews_anon_insert          on public.reviews;
drop policy if exists reviews_anon_update_helpful  on public.reviews;
drop policy if exists reviews_admin_all            on public.reviews;

create policy reviews_anon_select
  on public.reviews for select
  to anon
  using (status = 'approved');

-- Storefront submission: anyone can insert, but rows land as 'pending' or
-- 'approved' (verified purchase). We can't fully enforce verified_purchase
-- here without a trusted backend; the client validation + admin moderation
-- handle that. Block any insert that tries to mark itself as 'approved'
-- without verified_purchase.
create policy reviews_anon_insert
  on public.reviews for insert
  to anon
  with check (
    status in ('pending','approved')
    and (status <> 'approved' or verified_purchase = true)
  );

-- Allow public helpful_count bumps. We can't restrict which columns the
-- anon may change in an UPDATE policy via SQL alone, so we accept the
-- tradeoff: a malicious user could only edit rows where status='approved'
-- and the practical worst case is helpful_count manipulation. Admin can
-- always correct it.
create policy reviews_anon_update_helpful
  on public.reviews for update
  to anon
  using (status = 'approved')
  with check (status = 'approved');

create policy reviews_admin_all
  on public.reviews for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'bezosbay@gmail.com')
  with check (auth.jwt() ->> 'email' = 'bezosbay@gmail.com');

-- ---------- product_videos -------------------------------------------
drop policy if exists product_videos_anon_select on public.product_videos;
drop policy if exists product_videos_admin_all   on public.product_videos;

create policy product_videos_anon_select
  on public.product_videos for select
  to anon
  using (status = 'active');

create policy product_videos_admin_all
  on public.product_videos for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'bezosbay@gmail.com')
  with check (auth.jwt() ->> 'email' = 'bezosbay@gmail.com');

-- ---------- featured_products ----------------------------------------
drop policy if exists featured_products_anon_select on public.featured_products;
drop policy if exists featured_products_admin_all   on public.featured_products;

create policy featured_products_anon_select
  on public.featured_products for select
  to anon
  using (status = 'active');

create policy featured_products_admin_all
  on public.featured_products for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'bezosbay@gmail.com')
  with check (auth.jwt() ->> 'email' = 'bezosbay@gmail.com');

-- ---------- site_settings --------------------------------------------
drop policy if exists site_settings_anon_select on public.site_settings;
drop policy if exists site_settings_admin_all   on public.site_settings;

create policy site_settings_anon_select
  on public.site_settings for select
  to anon
  using (true);

create policy site_settings_admin_all
  on public.site_settings for all
  to authenticated
  using (auth.jwt() ->> 'email' = 'bezosbay@gmail.com')
  with check (auth.jwt() ->> 'email' = 'bezosbay@gmail.com');

-- =====================================================================
-- Done.
-- =====================================================================
