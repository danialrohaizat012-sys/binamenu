-- =========================================================
-- Digital Menu: schema untuk SATU kedai
-- Jalankan dalam Supabase: SQL Editor > New query > Run
-- =========================================================

-- Maklumat kedai (satu baris sahaja, id = 1)
create table if not exists public.settings (
  id           int primary key default 1 check (id = 1),
  name         text not null default 'Kedai Saya',
  tagline      text,
  logo_url     text,
  phone        text,
  address      text,
  opening_hours text,
  theme_color  text not null default '#ea580c',
  updated_at   timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  image_url   text,
  is_available boolean not null default true,
  is_popular  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists menu_items_category_idx on public.menu_items(category_id);

-- Senarai pengguna yang dibenarkan edit menu
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------- Row Level Security ----------------
alter table public.settings   enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.admins     enable row level security;

-- Orang awam boleh BACA menu
drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read items" on public.menu_items;
create policy "public read items" on public.menu_items for select using (true);

-- Hanya admin boleh TULIS
drop policy if exists "admin write settings" on public.settings;
create policy "admin write settings" on public.settings for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write items" on public.menu_items;
create policy "admin write items" on public.menu_items for all
  using (public.is_admin()) with check (public.is_admin());

-- Admin boleh semak status diri sendiri
drop policy if exists "self read admin" on public.admins;
create policy "self read admin" on public.admins for select using (user_id = auth.uid());

-- ---------------- Storage untuk gambar ----------------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "public read menu images" on storage.objects;
create policy "public read menu images" on storage.objects for select
  using (bucket_id = 'menu-images');
drop policy if exists "admin upload menu images" on storage.objects;
create policy "admin upload menu images" on storage.objects for insert
  with check (bucket_id = 'menu-images' and public.is_admin());
drop policy if exists "admin update menu images" on storage.objects;
create policy "admin update menu images" on storage.objects for update
  using (bucket_id = 'menu-images' and public.is_admin());
drop policy if exists "admin delete menu images" on storage.objects;
create policy "admin delete menu images" on storage.objects for delete
  using (bucket_id = 'menu-images' and public.is_admin());
