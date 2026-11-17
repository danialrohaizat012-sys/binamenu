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
  template     text not null default 'klasik',
  updated_at   timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Untuk projek yang dicipta sebelum template UI ditambah
alter table public.settings add column if not exists template text not null default 'klasik';
alter table public.settings drop constraint if exists settings_template_check;
alter table public.settings add constraint settings_template_check
  check (template in ('klasik', 'kafe', 'premium', 'warung'));

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

-- =========================================================
-- SMART: pesanan meja, mod pelayan, pilihan item, laporan
-- (selamat dijalankan semula; tambahan kepada bahagian di atas)
-- =========================================================

-- Peranan: owner (urus menu & laporan) atau kru (paparan kru & mod pelayan)
alter table public.admins add column if not exists role text not null default 'owner';
alter table public.admins drop constraint if exists admins_role_check;
alter table public.admins add constraint admins_role_check check (role in ('owner', 'kru'));

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and role = 'owner');
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Pelan langganan outlet. Hanya BinaLab ubah (tiada polisi tulis untuk pengguna).
create table if not exists public.subscription (
  id         int primary key default 1 check (id = 1),
  plan       text not null default 'lite' check (plan in ('lite', 'smart', 'pro')),
  updated_at timestamptz not null default now()
);
insert into public.subscription (id) values (1) on conflict (id) do nothing;
alter table public.subscription enable row level security;
drop policy if exists "public read subscription" on public.subscription;
create policy "public read subscription" on public.subscription for select using (true);

-- Pilihan item, cth. [{"name":"Gula","required":true,"multi":false,
--   "choices":[{"name":"Biasa","price":0},{"name":"Kurang manis","price":0}]}]
alter table public.menu_items add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.menu_items drop constraint if exists menu_items_options_array;
alter table public.menu_items add constraint menu_items_options_array check (jsonb_typeof(options) = 'array');

-- Meja dengan kod pendek untuk pautan NFC/QR: /t/{code}
create or replace function public.gen_table_code()
returns text
language plpgsql volatile
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; -- tanpa 0/O, 1/I/L
  result text;
begin
  loop
    result := '';
    for i in 1..5 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.dining_tables where code = result);
  end loop;
  return result;
end;
$$;

create table if not exists public.dining_tables (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  code       text not null unique,
  is_active  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.dining_tables alter column code set default public.gen_table_code();
alter table public.dining_tables enable row level security;
drop policy if exists "public read active tables" on public.dining_tables;
create policy "public read active tables" on public.dining_tables for select using (is_active or public.is_staff());
drop policy if exists "admin write tables" on public.dining_tables;
create policy "admin write tables" on public.dining_tables for all
  using (public.is_admin()) with check (public.is_admin());

-- Pesanan
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  number      bigint generated by default as identity,
  table_id    uuid references public.dining_tables(id) on delete set null,
  table_label text not null,
  source      text not null check (source in ('pelanggan', 'pelayan')),
  status      text not null default 'baru' check (status in ('baru', 'siap', 'batal')),
  note        text,
  total       numeric(10,2) not null default 0,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  done_at     timestamptz
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_table_created_idx on public.orders(table_id, created_at desc);

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  item_id    uuid references public.menu_items(id) on delete set null,
  name       text not null,
  unit_price numeric(10,2) not null,
  quantity   int not null check (quantity between 1 and 20),
  options    jsonb not null default '[]'::jsonb,
  note       text,
  line_total numeric(10,2) not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders for select using (public.is_staff());
drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders" on public.orders for update
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff read order items" on public.order_items;
create policy "staff read order items" on public.order_items for select using (public.is_staff());
-- Pesanan hanya dicipta melalui place_order(); kru hanya boleh tukar status.
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
grant update (status, done_at) on public.orders to authenticated;

-- Cipta pesanan. Harga dan pilihan disemak di sini, bukan di telefon pelanggan.
-- p_items: [{"item_id":"...","quantity":2,"note":"tak nak sayur",
--            "options":[{"group":"Gula","choice":"Kurang manis"}]}]
create or replace function public.place_order(
  p_code text, p_items jsonb, p_note text default null, p_source text default 'pelanggan'
)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
declare
  t public.dining_tables;
  v_plan text;
  v_order public.orders;
  v_total numeric(10,2) := 0;
  it jsonb;
  mi public.menu_items;
  grp jsonb;
  sel jsonb;
  chosen jsonb;
  ch jsonb;
  v_qty int;
  v_unit numeric(10,2);
  v_count int;
begin
  select * into t from public.dining_tables where code = upper(trim(p_code)) and is_active;
  if not found then raise exception 'Meja tidak dijumpai. Sila imbas semula kad di meja.'; end if;

  select plan into v_plan from public.subscription where id = 1;
  if coalesce(v_plan, 'lite') not in ('smart', 'pro') then
    raise exception 'Pesanan dari meja belum dibuka untuk kedai ini.';
  end if;

  if p_source = 'pelayan' then
    if not public.is_staff() then raise exception 'Hanya kru boleh hantar pesanan sebagai pelayan.'; end if;
  elsif p_source = 'pelanggan' then
    -- Elak spam: maksimum 3 pesanan pelanggan setiap meja dalam 2 minit
    select count(*) into v_count from public.orders
      where table_id = t.id and source = 'pelanggan' and created_at > now() - interval '2 minutes';
    if v_count >= 3 then raise exception 'Terlalu banyak pesanan dari meja ini. Sila tunggu sebentar.'; end if;
  else
    raise exception 'Sumber pesanan tidak sah.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Pesanan kosong.';
  end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Terlalu banyak item dalam satu pesanan.'; end if;
  if length(coalesce(p_note, '')) > 200 then raise exception 'Catatan terlalu panjang.'; end if;

  insert into public.orders (table_id, table_label, source, note, created_by)
  values (t.id, t.label, p_source, nullif(trim(p_note), ''), auth.uid())
  returning * into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into mi from public.menu_items where id = (it->>'item_id')::uuid;
    if not found then raise exception 'Item tidak dijumpai.'; end if;
    if not mi.is_available then raise exception '% sudah habis.', mi.name; end if;

    v_qty := coalesce((it->>'quantity')::int, 0);
    if v_qty < 1 or v_qty > 20 then raise exception 'Kuantiti % tidak sah.', mi.name; end if;
    if length(coalesce(it->>'note', '')) > 140 then raise exception 'Catatan % terlalu panjang.', mi.name; end if;

    sel := coalesce(it->'options', '[]'::jsonb);
    if jsonb_typeof(sel) <> 'array' then raise exception 'Pilihan % tidak sah.', mi.name; end if;
    -- Kumpulan yang dipilih mesti wujud pada item
    if exists (
      select 1 from jsonb_array_elements(sel) s
      where not exists (select 1 from jsonb_array_elements(mi.options) g where g->>'name' = s->>'group')
    ) then raise exception 'Pilihan % tidak sah.', mi.name; end if;

    v_unit := mi.price;
    chosen := '[]'::jsonb;
    for grp in select * from jsonb_array_elements(mi.options) loop
      select count(*) into v_count from jsonb_array_elements(sel) s where s->>'group' = grp->>'name';
      if coalesce((grp->>'required')::boolean, false) and v_count = 0 then
        raise exception 'Sila pilih % untuk %.', grp->>'name', mi.name;
      end if;
      if not coalesce((grp->>'multi')::boolean, false) and v_count > 1 then
        raise exception 'Pilih satu sahaja % untuk %.', grp->>'name', mi.name;
      end if;
      for ch in
        select c from jsonb_array_elements(sel) s
          join lateral jsonb_array_elements(grp->'choices') c on c->>'name' = s->>'choice'
        where s->>'group' = grp->>'name'
      loop
        v_unit := v_unit + coalesce((ch->>'price')::numeric, 0);
        chosen := chosen || jsonb_build_object('group', grp->>'name', 'choice', ch->>'name', 'price', coalesce((ch->>'price')::numeric, 0));
      end loop;
    end loop;
    if jsonb_array_length(chosen) <> jsonb_array_length(sel) then
      raise exception 'Pilihan % tidak sah.', mi.name;
    end if;

    insert into public.order_items (order_id, item_id, name, unit_price, quantity, options, note, line_total)
    values (v_order.id, mi.id, mi.name, v_unit, v_qty, chosen, nullif(trim(it->>'note'), ''), v_unit * v_qty);
    v_total := v_total + v_unit * v_qty;
  end loop;

  update public.orders set total = v_total where id = v_order.id;
  return jsonb_build_object('id', v_order.id, 'number', v_order.number, 'total', v_total, 'table', t.label);
end;
$$;
revoke all on function public.place_order(text, jsonb, text, text) from public;
grant execute on function public.place_order(text, jsonb, text, text) to anon, authenticated;

-- Status pesanan untuk pelanggan (perlu kod meja yang sama)
create or replace function public.order_status(p_order uuid, p_code text)
returns text
language sql stable security definer set search_path = public
as $$
  select o.status from public.orders o join public.dining_tables t on t.id = o.table_id
  where o.id = p_order and t.code = upper(trim(p_code));
$$;
grant execute on function public.order_status(uuid, text) to anon, authenticated;

-- Laporan mingguan untuk owner (waktu Malaysia). p_start = hari pertama minggu.
create or replace function public.weekly_report(p_start date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  t0 timestamptz := (p_start::timestamp) at time zone 'Asia/Kuala_Lumpur';
  t1 timestamptz := ((p_start + 7)::timestamp) at time zone 'Asia/Kuala_Lumpur';
  r jsonb;
begin
  if not public.is_admin() then raise exception 'Hanya owner boleh lihat laporan.'; end if;
  with o as (
    select * from public.orders where created_at >= t0 and created_at < t1
  ), ok as (select * from o where status <> 'batal')
  select jsonb_build_object(
    'start', p_start, 'end', p_start + 6,
    'orders', (select count(*) from ok),
    'cancelled', (select count(*) from o where status = 'batal'),
    'revenue', (select coalesce(sum(total), 0) from ok),
    'from_customer', (select count(*) from ok where source = 'pelanggan'),
    'from_waiter', (select count(*) from ok where source = 'pelayan'),
    'tables_used', (select count(distinct table_id) from ok),
    'avg_minutes_to_done', (select round(avg(extract(epoch from done_at - created_at) / 60)::numeric, 1)
                            from ok where status = 'siap' and done_at is not null),
    'with_options_or_notes', (select count(distinct ok.id) from ok join public.order_items oi on oi.order_id = ok.id
                              where jsonb_array_length(oi.options) > 0 or oi.note is not null or ok.note is not null),
    'prev_orders', (select count(*) from public.orders
                    where status <> 'batal' and created_at >= t0 - interval '7 days' and created_at < t0),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'orders', n) order by d), '[]'::jsonb) from (
                 select (created_at at time zone 'Asia/Kuala_Lumpur')::date d, count(*) n from ok group by 1) x),
    'by_hour', (select coalesce(jsonb_agg(jsonb_build_object('hour', h, 'orders', n) order by h), '[]'::jsonb) from (
                 select extract(hour from created_at at time zone 'Asia/Kuala_Lumpur')::int h, count(*) n from ok group by 1) x),
    'top_items', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'qty', q) order by q desc, name), '[]'::jsonb) from (
                 select oi.name, sum(oi.quantity) q from ok join public.order_items oi on oi.order_id = ok.id
                 group by oi.name order by q desc, oi.name limit 5) x)
  ) into r;
  return r;
end;
$$;
grant execute on function public.weekly_report(date) to authenticated;

-- Paparan kru terima pesanan baru secara masa nyata (Supabase Realtime)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
