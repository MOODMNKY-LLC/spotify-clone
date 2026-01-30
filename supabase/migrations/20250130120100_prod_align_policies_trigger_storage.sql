/*
 * Prod alignment part 2: RLS policies, auth trigger, storage buckets and policies.
 * Run after 20250130120000_prod_align_idempotent.sql. Uses drop if exists + create
 * so safe to re-run. Skip or adapt if prod has shared tables/policies from other apps.
 */

-- ========== public.users ==========
drop policy if exists "users_select_anon" on public.users;
drop policy if exists "users_select_authenticated" on public.users;
drop policy if exists "users_insert_authenticated" on public.users;
drop policy if exists "users_update_authenticated" on public.users;
create policy "users_select_anon" on public.users for select to anon using (true);
create policy "users_select_authenticated" on public.users for select to authenticated using (true);
create policy "users_insert_authenticated" on public.users for insert to authenticated with check (auth.uid() = id);
create policy "users_update_authenticated" on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ========== public.products ==========
drop policy if exists "products_select_anon" on public.products;
drop policy if exists "products_select_authenticated" on public.products;
create policy "products_select_anon" on public.products for select to anon using (true);
create policy "products_select_authenticated" on public.products for select to authenticated using (true);

-- ========== public.prices ==========
drop policy if exists "prices_select_anon" on public.prices;
drop policy if exists "prices_select_authenticated" on public.prices;
create policy "prices_select_anon" on public.prices for select to anon using (true);
create policy "prices_select_authenticated" on public.prices for select to authenticated using (true);

-- ========== public.customers ==========
drop policy if exists "customers_select_authenticated" on public.customers;
drop policy if exists "customers_insert_authenticated" on public.customers;
drop policy if exists "customers_update_authenticated" on public.customers;
create policy "customers_select_authenticated" on public.customers for select to authenticated using (auth.uid() = id);
create policy "customers_insert_authenticated" on public.customers for insert to authenticated with check (auth.uid() = id);
create policy "customers_update_authenticated" on public.customers for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ========== public.songs ==========
drop policy if exists "songs_select_anon" on public.songs;
drop policy if exists "songs_select_authenticated" on public.songs;
drop policy if exists "songs_insert_authenticated" on public.songs;
drop policy if exists "songs_update_authenticated" on public.songs;
drop policy if exists "songs_delete_authenticated" on public.songs;
create policy "songs_select_anon" on public.songs for select to anon using (true);
create policy "songs_select_authenticated" on public.songs for select to authenticated using (true);
create policy "songs_insert_authenticated" on public.songs for insert to authenticated with check (auth.uid() = user_id);
create policy "songs_update_authenticated" on public.songs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "songs_delete_authenticated" on public.songs for delete to authenticated using (auth.uid() = user_id);

-- ========== public.liked_songs ==========
drop policy if exists "liked_songs_select_authenticated" on public.liked_songs;
drop policy if exists "liked_songs_insert_authenticated" on public.liked_songs;
drop policy if exists "liked_songs_delete_authenticated" on public.liked_songs;
create policy "liked_songs_select_authenticated" on public.liked_songs for select to authenticated using (auth.uid() = user_id);
create policy "liked_songs_insert_authenticated" on public.liked_songs for insert to authenticated with check (auth.uid() = user_id);
create policy "liked_songs_delete_authenticated" on public.liked_songs for delete to authenticated using (auth.uid() = user_id);

-- ========== public.subscriptions ==========
drop policy if exists "subscriptions_select_authenticated" on public.subscriptions;
drop policy if exists "subscriptions_insert_authenticated" on public.subscriptions;
drop policy if exists "subscriptions_update_authenticated" on public.subscriptions;
create policy "subscriptions_select_authenticated" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "subscriptions_insert_authenticated" on public.subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "subscriptions_update_authenticated" on public.subscriptions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== public.liked_navidrome_tracks ==========
drop policy if exists "liked_navidrome_tracks_select_authenticated" on public.liked_navidrome_tracks;
drop policy if exists "liked_navidrome_tracks_insert_authenticated" on public.liked_navidrome_tracks;
drop policy if exists "liked_navidrome_tracks_delete_authenticated" on public.liked_navidrome_tracks;
create policy "liked_navidrome_tracks_select_authenticated" on public.liked_navidrome_tracks for select to authenticated using (auth.uid() = user_id);
create policy "liked_navidrome_tracks_insert_authenticated" on public.liked_navidrome_tracks for insert to authenticated with check (auth.uid() = user_id);
create policy "liked_navidrome_tracks_delete_authenticated" on public.liked_navidrome_tracks for delete to authenticated using (auth.uid() = user_id);

-- ========== auth trigger: public.users on signup + first user = admin ==========
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'user'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, users.full_name),
    avatar_url = coalesce(excluded.avatar_url, users.avatar_url);

  update public.users
  set role = 'admin'
  where id = new.id
    and (select count(*) from public.users) = 1;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

update public.users
set role = 'admin'
where id = (select id from public.users order by id limit 1)
  and role = 'user';

-- ========== storage buckets (idempotent) ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'songs',
  'songs',
  true,
  52428800,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
on conflict (id) do nothing;

-- ========== storage.objects policies ==========
drop policy if exists "images_select_public" on storage.objects;
drop policy if exists "images_insert_authenticated" on storage.objects;
drop policy if exists "images_update_authenticated" on storage.objects;
drop policy if exists "images_delete_authenticated" on storage.objects;
drop policy if exists "songs_select_public" on storage.objects;
drop policy if exists "songs_insert_authenticated" on storage.objects;
drop policy if exists "songs_update_authenticated" on storage.objects;
drop policy if exists "songs_delete_authenticated" on storage.objects;

create policy "images_select_public" on storage.objects for select to public using (bucket_id = 'images');
create policy "images_insert_authenticated" on storage.objects for insert to authenticated with check (bucket_id = 'images');
create policy "images_update_authenticated" on storage.objects for update to authenticated using (bucket_id = 'images');
create policy "images_delete_authenticated" on storage.objects for delete to authenticated using (bucket_id = 'images');
create policy "songs_select_public" on storage.objects for select to public using (bucket_id = 'songs');
create policy "songs_insert_authenticated" on storage.objects for insert to authenticated with check (bucket_id = 'songs');
create policy "songs_update_authenticated" on storage.objects for update to authenticated using (bucket_id = 'songs');
create policy "songs_delete_authenticated" on storage.objects for delete to authenticated using (bucket_id = 'songs');
