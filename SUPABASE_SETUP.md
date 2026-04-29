# Supabase Setup — Admin Panel + Reviews + Videos + Featured + Banner

This sets up everything the WoowFinds admin panel (`/admin`) needs:

- User-submitted **reviews** (already wired into PDP)
- **Instagram Reel + TikTok** video strip per product
- Curated homepage **featured products** grid
- Editable **flash-sale banner** (text + countdown + on/off)
- A single hidden admin login at `/admin` for **bezosbay@gmail.com**

Until you complete these steps, every admin-managed surface falls back to a default (banner shows a built-in message, featured grid uses Shopify best-sellers, video strip stays hidden).

---

## 1. Create a fresh Supabase project

1. Go to <https://app.supabase.com> → **New project**.
2. Pick a region close to your customers.
3. Save the database password somewhere safe.
4. Wait ~2 minutes for provisioning.

---

## 2. Run the schema + RLS

Open **SQL Editor** → **New query** → paste the entire contents of [`supabase/setup.sql`](supabase/setup.sql) → **Run**.

This creates four tables (`reviews`, `product_videos`, `featured_products`, `site_settings`), wires up Row Level Security with an allowlist for `bezosbay@gmail.com`, and seeds the banner row.

---

## 3. Create the admin user

In Supabase dashboard:

1. **Authentication → Users → Add user**
2. Email: `bezosbay@gmail.com`
3. Set a strong password.
4. **Auto Confirm User: ON**
5. **Authentication → Providers → Email → turn OFF "Enable signups"** so nobody can self-register.

---

## 4. Wire the credentials into the storefront

1. **Project Settings → API** → copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long JWT)
2. Open [`js/supabase-config.js`](js/supabase-config.js) and replace the placeholders:

```js
export const SUPABASE_CONFIG = {
  url: 'https://xxxx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR…',
};
```

`SUPABASE_ENABLED` flips automatically once those placeholders are gone.

3. Commit + push. Vercel deploys.

---

## 5. Use the admin panel

Go to **<https://woowfinds.com/admin>** (no link from the storefront — type the URL).

Sign in with `bezosbay@gmail.com`. You'll land on a dashboard with four tabs:

| Tab          | What it does                                                                 |
|--------------|-------------------------------------------------------------------------------|
| **Reviews**  | View / approve / edit / delete every user-submitted review.                   |
| **Videos**   | Paste Instagram Reel or TikTok URLs per product. Show on PDP video strip.     |
| **Featured** | Curate the homepage trending grid. Empty list = falls back to best-sellers.   |
| **Banner**   | Edit the red top-of-site banner text + countdown end + on/off toggle.         |

Sign out with the button in the bottom-left corner of the sidebar.

---

## 6. Security notes

- `anon` key is **public** by design (it's in the JS bundle). Real protection is RLS:
  - Only rows with `status = 'approved'` / `'active'` are readable by `anon`.
  - Writes require an authenticated JWT whose email matches the allowlist in [`supabase/setup.sql`](supabase/setup.sql).
- If you ever need to change the admin email, search/replace `bezosbay@gmail.com` in:
  - `supabase/setup.sql` — and re-run the policy block in the SQL editor.
  - `js/supabase-config.js` (`ADMIN_EMAIL`).

---

## 7. Troubleshooting

- **"Supabase not configured"** on `/admin`: you haven't filled in `js/supabase-config.js` yet, or the URL/key still contains `YOUR-PROJECT` / `YOUR_`.
- **"Wrong email or password"** but creds are right: check that the user exists in **Authentication → Users** and that **Auto Confirm User** was on.
- **"Not authorized"**: you logged in with a non-allowlisted email. Only `bezosbay@gmail.com` is permitted.
- **PDP video strip never shows**: confirm the row in `product_videos` has `status = 'active'` and the `product_handle` exactly matches the Shopify handle (case-sensitive, no leading slash).
