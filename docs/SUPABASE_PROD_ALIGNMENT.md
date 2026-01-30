# Aligning This Project With a Shared Prod Supabase Instance

Your prod Supabase project has **other apps’ tables and data**. This doc helps you add this app’s schema **without breaking** existing objects.

## How to Run the Alignment (Quick)

1. **Back up prod** (or run on a staging clone first).
2. In **Supabase Dashboard → SQL Editor**, open each migration file below and run its contents **in order**:
   - `supabase/migrations/20250130120000_prod_align_idempotent.sql` (tables, enums, RLS enable)
   - `supabase/migrations/20250130120100_prod_align_policies_trigger_storage.sql` (policies, auth trigger, storage)
3. Or link the Supabase CLI to prod and run:  
   `supabase db push`  
   (applies all migrations in order).

**Note:** If prod already has policies or a trigger with the same names from another app, the second migration will replace them. Audit first (Step 1 below) and skip or edit that file if needed.

## What This App Needs

| Object | Purpose |
|--------|--------|
| **Enums** | `pricing_plan_interval`, `pricing_type`, `subscription_status` (Stripe) |
| **Tables** | `users`, `products`, `prices`, `customers`, `songs`, `liked_songs`, `subscriptions`, `liked_navidrome_tracks` |
| **Auth trigger** | `handle_new_user` on `auth.users` → inserts/updates `public.users` |
| **Storage buckets** | `images`, `songs` (with RLS) |

All of these live in the **`public`** schema. `users.id` references `auth.users(id)`.

---

## Step 1: Audit Prod (Do This First)

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- Tables in public
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- Custom enums in public
select typname
from pg_type
where typnamespace = (select oid from pg_namespace where nspname = 'public')
  and typtype = 'e'
order by typname;

-- Storage buckets
select id, name, public from storage.buckets order by id;

-- Triggers on auth.users
select trigger_name, event_manipulation
from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users';
```

Compare with the list above. Note:

- Which of **this app’s tables** already exist (and whether they’re from this app or another).
- Whether **enums** or **trigger** names would conflict.
- Whether **buckets** `images` / `songs` already exist (and if they’re shared).

---

## Step 2: Choose an Approach

### Option A – Prod Has No Overlap (Recommended When Possible)

If **none** of this app’s tables/enums/trigger exist yet:

1. Link the Supabase CLI to prod (or run SQL in Dashboard).
2. Run this project’s migrations **in order**:
   - `20250129180000_initial_schema.sql`
   - `20250129180100_storage_buckets.sql`
   - `20250129200000_liked_navidrome_tracks.sql`
   - `20250129210000_rbac_subscription_bypass.sql`
3. If something fails (e.g. “type already exists”), that object is already in prod. Note it and either skip that part or use the idempotent migration (Option B) for that object only.

### Option B – Prod Has Other Projects (Overlap Possible)

If **some** of these tables/enums/trigger already exist (e.g. shared `users`, or another app’s Stripe tables):

1. **Do not** run the original migrations as-is; they use `CREATE TABLE` / `CREATE TYPE` without `IF NOT EXISTS` and can conflict.
2. Use the **idempotent alignment migration** in `supabase/migrations/` named `*_prod_align_idempotent.sql`. It:
   - Creates **enums** only if they don’t exist.
   - Creates **tables** only if they don’t exist (`CREATE TABLE IF NOT EXISTS`).
   - Adds **columns** to `public.users` that this app needs (`role`, `beta_until`) with `ADD COLUMN IF NOT EXISTS`.
   - Enables **RLS** on tables (idempotent).
   - Does **not** create RLS policies (to avoid overwriting another app’s policies).

3. **After** running that migration:
   - For **tables that were just created** by the migration: add RLS policies by running the policy parts of the original migrations (e.g. copy from `20250129180000_initial_schema.sql` and similar), or add equivalent policies manually.
   - For **tables that already existed** (e.g. shared `users`): only the extra columns (`role`, `beta_until`) were added; do **not** replace existing RLS. Add or adjust policies only if this app needs different rules, and use distinct policy names if needed (e.g. `mnky_users_select_authenticated`) to avoid conflicts.

4. **Auth trigger**: If no other app depends on `handle_new_user` / `on_auth_user_created`, you can run the trigger/function from `20250129180000_initial_schema.sql` and `20250129210000_rbac_subscription_bypass.sql`. If multiple apps share `auth.users`, coordinate so only one trigger writes to `public.users`, or use a single trigger that handles all apps.

5. **Storage**: Run the storage migration (`20250129180100_storage_buckets.sql`) or the bucket + RLS parts. It uses `ON CONFLICT (id) DO NOTHING`, so existing buckets are left as-is.

---

## Step 3: After Alignment

- Point this app at prod using **Project URL** and **anon + service role keys** (e.g. in Vercel/env).
- Ensure **Stripe webhook** uses the prod Supabase URL and keys so `products`, `prices`, `customers`, `subscriptions` stay in sync.
- Test: sign up, login, likes, playlists, and (if used) Stripe flows.

---

## Summary

| Situation | Action |
|-----------|--------|
| Prod has no conflicting tables/enums/trigger | Run existing migrations in order (Option A). |
| Prod has other projects’ tables/enums | Run the idempotent alignment migration; then add RLS and trigger as needed (Option B). |
| Shared `users` table | Use idempotent migration to add `role` / `beta_until` only; don’t replace existing RLS; use distinct policy names if adding new ones. |

Always **back up prod** (or use a staging clone) before running migrations the first time.
