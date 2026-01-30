/*
 * Idempotent alignment for prod: add this app's schema without breaking existing objects.
 * Use when prod already has other projects' tables. Creates enums/tables only if missing,
 * adds users.role and users.beta_until if missing, enables RLS. Does NOT create RLS
 * policies (add those manually or from original migrations for tables you own).
 */

-- 1. Enums (create only if not exist)
do $$
begin
  create type public.pricing_plan_interval as enum ('day', 'week', 'month', 'year');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.pricing_type as enum ('one_time', 'recurring');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.subscription_status as enum (
    'trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid'
  );
exception
  when duplicate_object then null;
end
$$;

-- 2. Tables (create only if not exist)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  avatar_url text,
  billing_address jsonb,
  full_name text,
  payment_method jsonb
);
comment on table public.users is 'App user profiles and billing; id matches auth.users.';

create table if not exists public.products (
  id text primary key,
  active boolean,
  description text,
  image text,
  metadata jsonb,
  name text
);
comment on table public.products is 'Stripe products; synced via webhook.';

create table if not exists public.prices (
  id text primary key,
  active boolean,
  currency text,
  description text,
  interval public.pricing_plan_interval,
  interval_count integer,
  metadata jsonb,
  product_id text references public.products (id) on delete cascade,
  trial_period_days integer,
  type public.pricing_type,
  unit_amount bigint
);
comment on table public.prices is 'Stripe prices; synced via webhook.';

create table if not exists public.customers (
  id uuid primary key references public.users (id) on delete cascade,
  stripe_customer_id text
);
comment on table public.customers is 'Stripe customer id per user.';

create table if not exists public.songs (
  id bigint generated always as identity primary key,
  author text,
  created_at timestamptz default now(),
  image_path text,
  song_path text,
  title text,
  user_id uuid references public.users (id) on delete cascade
);
comment on table public.songs is 'User-uploaded songs.';

create table if not exists public.liked_songs (
  created_at timestamptz default now(),
  song_id bigint not null references public.songs (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  primary key (user_id, song_id)
);
comment on table public.liked_songs is 'User likes for songs.';

create table if not exists public.subscriptions (
  id text primary key,
  cancel_at timestamptz,
  cancel_at_period_end boolean,
  canceled_at timestamptz,
  created timestamptz not null default now(),
  current_period_end timestamptz not null,
  current_period_start timestamptz not null,
  ended_at timestamptz,
  metadata jsonb,
  price_id text references public.prices (id) on delete set null,
  quantity integer,
  status public.subscription_status,
  trial_end timestamptz,
  trial_start timestamptz,
  user_id uuid not null references public.users (id) on delete cascade
);
comment on table public.subscriptions is 'Stripe subscriptions; synced via webhook.';

create table if not exists public.liked_navidrome_tracks (
  user_id uuid not null references public.users (id) on delete cascade,
  navidrome_track_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, navidrome_track_id)
);
comment on table public.liked_navidrome_tracks is 'User likes for Navidrome (Subsonic) tracks.';

-- 3. Add RBAC columns to users if missing (safe when users already exists from another app)
alter table public.users
  add column if not exists role text not null default 'user' check (role in ('admin', 'beta', 'user')),
  add column if not exists beta_until timestamptz;

comment on column public.users.role is 'Access role: admin (full), beta (PIN), user (subscription required).';
comment on column public.users.beta_until is 'When beta access expires; null = no expiry or not beta.';

-- 4. Enable RLS on all tables (idempotent)
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.prices enable row level security;
alter table public.customers enable row level security;
alter table public.songs enable row level security;
alter table public.liked_songs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.liked_navidrome_tracks enable row level security;

-- RLS policies are NOT created here to avoid overwriting another app's policies.
-- For tables created by this migration, add policies from the original migrations
-- (20250129180000_initial_schema.sql, 20250129200000_liked_navidrome_tracks.sql).
-- For shared tables (e.g. users), add or adjust policies with distinct names if needed.
