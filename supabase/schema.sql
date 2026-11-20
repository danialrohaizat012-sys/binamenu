-- =========================================================
-- Bina Menu: schema MULTI-OUTLET (satu projek Supabase untuk semua outlet)
-- Jalankan dalam Supabase: SQL Editor > New query > Run
-- Selamat dijalankan semula. Untuk projek BARU; bukan naik taraf daripada
-- schema satu-outlet yang lama.
-- =========================================================

-- ---------------- Syarikat, outlet, keahlian ----------------

create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.outlets (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  name          text not null,
  tagline       text,
  logo_url      text,
  phone         text,
  address       text,
  opening_hours text,
  theme_color   text not null default '#ea580c',
  template      text not null default 'klasik' check (template in ('klasik', 'kafe', 'premium', 'warung')),
  plan          text not null default 'lite' check (plan in ('lite', 'smart')),  -- Lite RM29, Smart RM69
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists outlets_company_idx on public.outlets(company_id);

-- owner dengan outlet_id kosong = owner semua outlet dalam syarikat itu
create table if not exists public.memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  outlet_id  uuid references public.outlets(id) on delete cascade,
  role       text not null check (role in ('owner', 'kru')),
  created_at timestamptz not null default now(),
  check (role = 'owner' or outlet_id is not null)
);
create unique index if not exists memberships_unique
  on public.memberships(user_id, company_id, coalesce(outlet_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists memberships_user_idx on public.memberships(user_id);

-- Pembantu akses (security definer supaya polisi tidak berulang-ulang)
create or replace function public.outlet_role(p_outlet uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select case
    when bool_or(m.role = 'owner') then 'owner'
    when bool_or(m.role = 'kru') then 'kru'
  end
  from public.memberships m
  join public.outlets o on o.id = p_outlet
  where m.user_id = auth.uid()
    and m.company_id = o.company_id
    and (m.outlet_id is null or m.outlet_id = p_outlet);
$$;

create or replace function public.is_outlet_staff(p_outlet uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.outlet_role(p_outlet) is not null, false); $$;

create or replace function public.is_outlet_owner(p_outlet uuid)
returns boolean language sql stable security definer set search_path = public
-- coalesce: tanpa keahlian, outlet_role() = NULL; mesti jadi false, bukan NULL
as $$ select coalesce(public.outlet_role(p_outlet) = 'owner', false); $$;

create or replace function public.is_outlet_live(p_outlet uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.outlets where id = p_outlet and is_active); $$;

-- Outlet yang boleh diakses oleh pengguna log masuk, dengan peranannya
create or replace function public.my_outlets()
returns table (id uuid, slug text, name text, plan text, role text)
language sql stable security definer set search_path = public
as $$
  select o.id, o.slug, o.name, o.plan, public.outlet_role(o.id)
  from public.outlets o
  where public.outlet_role(o.id) is not null
  order by o.name;
$$;

-- ---------------- Menu ----------------

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  outlet_id  uuid not null references public.outlets(id) on delete cascade,
  name       text not null,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists categories_outlet_idx on public.categories(outlet_id);

create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  outlet_id    uuid not null references public.outlets(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  image_url    text,
  is_available boolean not null default true,
  is_popular   boolean not null default false,
  sort_order   int not null default 0,
  -- cth. [{"name":"Gula","required":true,"multi":false,"choices":[{"name":"Kurang manis","price":0}]}]
  options      jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  created_at   timestamptz not null default now()
);
create index if not exists menu_items_outlet_idx on public.menu_items(outlet_id);
create index if not exists menu_items_category_idx on public.menu_items(category_id);

-- Kategori item mesti dari outlet yang sama
create or replace function public.check_item_category()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.categories c where c.id = new.category_id and c.outlet_id = new.outlet_id) then
    raise exception 'Kategori bukan milik outlet ini.';
  end if;
  return new;
end $$;
drop trigger if exists menu_items_category_outlet on public.menu_items;
create trigger menu_items_category_outlet before insert or update on public.menu_items
  for each row execute function public.check_item_category();

-- ---------------- Meja (pautan NFC/QR: /t/{code}) ----------------

create or replace function public.gen_table_code()
returns text language plpgsql volatile as $$
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
end $$;

create table if not exists public.dining_tables (
  id         uuid primary key default gen_random_uuid(),
  outlet_id  uuid not null references public.outlets(id) on delete cascade,
  label      text not null,
  code       text not null unique,
  is_active  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.dining_tables alter column code set default public.gen_table_code();
create index if not exists dining_tables_outlet_idx on public.dining_tables(outlet_id);

-- ---------------- Pesanan ----------------

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  outlet_id   uuid not null references public.outlets(id) on delete cascade,
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
create index if not exists orders_outlet_created_idx on public.orders(outlet_id, created_at desc);
create index if not exists orders_table_created_idx on public.orders(table_id, created_at desc);

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  outlet_id  uuid not null references public.outlets(id) on delete cascade,
  item_id    uuid references public.menu_items(id) on delete set null,
  name       text not null,
  unit_price numeric(10,2) not null,
  quantity   int not null check (quantity between 1 and 20),
  options    jsonb not null default '[]'::jsonb,
  note       text,
  line_total numeric(10,2) not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------------- Row Level Security ----------------

alter table public.companies     enable row level security;
alter table public.outlets       enable row level security;
alter table public.memberships   enable row level security;
alter table public.categories    enable row level security;
alter table public.menu_items    enable row level security;
alter table public.dining_tables enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;

drop policy if exists "staff read company" on public.companies;
create policy "staff read company" on public.companies for select
  using (exists (select 1 from public.memberships m where m.company_id = id and m.user_id = auth.uid()));

-- Outlet aktif boleh dibaca awam (menu); owner kemas kini butiran kedai sahaja (lihat GRANT di bawah)
drop policy if exists "read outlets" on public.outlets;
create policy "read outlets" on public.outlets for select using (is_active or public.is_outlet_staff(id));
drop policy if exists "owner update outlet" on public.outlets;
create policy "owner update outlet" on public.outlets for update
  using (public.is_outlet_owner(id)) with check (public.is_outlet_owner(id));

drop policy if exists "read own memberships" on public.memberships;
create policy "read own memberships" on public.memberships for select
  using (user_id = auth.uid() or (outlet_id is not null and public.is_outlet_owner(outlet_id)));

drop policy if exists "read menu categories" on public.categories;
create policy "read menu categories" on public.categories for select
  using (public.is_outlet_live(outlet_id) or public.is_outlet_staff(outlet_id));
drop policy if exists "owner write categories" on public.categories;
create policy "owner write categories" on public.categories for all
  using (public.is_outlet_owner(outlet_id)) with check (public.is_outlet_owner(outlet_id));

drop policy if exists "read menu items" on public.menu_items;
create policy "read menu items" on public.menu_items for select
  using (public.is_outlet_live(outlet_id) or public.is_outlet_staff(outlet_id));
drop policy if exists "owner write items" on public.menu_items;
create policy "owner write items" on public.menu_items for all
  using (public.is_outlet_owner(outlet_id)) with check (public.is_outlet_owner(outlet_id));

drop policy if exists "read tables" on public.dining_tables;
create policy "read tables" on public.dining_tables for select
  using ((is_active and public.is_outlet_live(outlet_id)) or public.is_outlet_staff(outlet_id));
drop policy if exists "owner write tables" on public.dining_tables;
create policy "owner write tables" on public.dining_tables for all
  using (public.is_outlet_owner(outlet_id)) with check (public.is_outlet_owner(outlet_id));

drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders for select using (public.is_outlet_staff(outlet_id));
drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders" on public.orders for update
  using (public.is_outlet_staff(outlet_id)) with check (public.is_outlet_staff(outlet_id));
drop policy if exists "staff read order items" on public.order_items;
create policy "staff read order items" on public.order_items for select using (public.is_outlet_staff(outlet_id));

-- Had lajur: owner tak boleh tukar pelan/slug/syarikat; kru hanya tukar status pesanan.
revoke insert, update, delete on public.companies, public.memberships from anon, authenticated;
revoke insert, delete on public.outlets from anon, authenticated;
revoke update on public.outlets from anon, authenticated;
grant update (name, tagline, logo_url, phone, address, opening_hours, theme_color, template, updated_at)
  on public.outlets to authenticated;
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;
grant update (status, done_at) on public.orders to authenticated;

-- ---------------- Cipta pesanan ----------------
-- Harga dan pilihan disemak di sini, bukan di telefon pelanggan.
-- p_items: [{"item_id":"...","quantity":2,"note":"tak nak sayur","options":[{"group":"Gula","choice":"Kurang manis"}]}]
create or replace function public.place_order(
  p_code text, p_items jsonb, p_note text default null, p_source text default 'pelanggan'
)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
declare
  t public.dining_tables;
  o public.outlets;
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
  select * into o from public.outlets where id = t.outlet_id and is_active;
  if not found then raise exception 'Meja tidak dijumpai. Sila imbas semula kad di meja.'; end if;
  if o.plan <> 'smart' then raise exception 'Pesanan dari meja belum dibuka untuk kedai ini.'; end if;

  if p_source = 'pelayan' then
    if not public.is_outlet_staff(o.id) then raise exception 'Hanya kru kedai ini boleh hantar pesanan sebagai pelayan.'; end if;
  elsif p_source = 'pelanggan' then
    -- Elak spam: maksimum 3 pesanan pelanggan setiap meja dalam 2 minit
    select count(*) into v_count from public.orders
      where table_id = t.id and source = 'pelanggan' and created_at > now() - interval '2 minutes';
    if v_count >= 3 then raise exception 'Terlalu banyak pesanan dari meja ini. Sila tunggu sebentar.'; end if;
  else
    raise exception 'Sumber pesanan tidak sah.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Pesanan kosong.'; end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Terlalu banyak item dalam satu pesanan.'; end if;
  if length(coalesce(p_note, '')) > 200 then raise exception 'Catatan terlalu panjang.'; end if;

  insert into public.orders (outlet_id, table_id, table_label, source, note, created_by)
  values (o.id, t.id, t.label, p_source, nullif(trim(p_note), ''), auth.uid())
  returning * into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into mi from public.menu_items where id = (it->>'item_id')::uuid and outlet_id = o.id;
    if not found then raise exception 'Item tidak dijumpai.'; end if;
    if not mi.is_available then raise exception '% sudah habis.', mi.name; end if;

    v_qty := coalesce((it->>'quantity')::int, 0);
    if v_qty < 1 or v_qty > 20 then raise exception 'Kuantiti % tidak sah.', mi.name; end if;
    if length(coalesce(it->>'note', '')) > 140 then raise exception 'Catatan % terlalu panjang.', mi.name; end if;

    sel := coalesce(it->'options', '[]'::jsonb);
    if jsonb_typeof(sel) <> 'array' then raise exception 'Pilihan % tidak sah.', mi.name; end if;
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
    if jsonb_array_length(chosen) <> jsonb_array_length(sel) then raise exception 'Pilihan % tidak sah.', mi.name; end if;

    insert into public.order_items (order_id, outlet_id, item_id, name, unit_price, quantity, options, note, line_total)
    values (v_order.id, o.id, mi.id, mi.name, v_unit, v_qty, chosen, nullif(trim(it->>'note'), ''), v_unit * v_qty);
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
returns text language sql stable security definer set search_path = public
as $$
  select o.status from public.orders o join public.dining_tables t on t.id = o.table_id
  where o.id = p_order and t.code = upper(trim(p_code));
$$;
grant execute on function public.order_status(uuid, text) to anon, authenticated;

-- ---------------- Laporan penggunaan mingguan (owner, waktu Malaysia; tiada angka jualan) ----------------
create or replace function public.weekly_report(p_outlet uuid, p_start date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  t0 timestamptz := (p_start::timestamp) at time zone 'Asia/Kuala_Lumpur';
  t1 timestamptz := ((p_start + 7)::timestamp) at time zone 'Asia/Kuala_Lumpur';
  r jsonb;
begin
  if not public.is_outlet_owner(p_outlet) then raise exception 'Hanya owner boleh lihat laporan.'; end if;
  with o as (
    select * from public.orders where outlet_id = p_outlet and created_at >= t0 and created_at < t1
  ), ok as (select * from o where status <> 'batal')
  select jsonb_build_object(
    'start', p_start, 'end', p_start + 6,
    'orders', (select count(*) from ok),
    'cancelled', (select count(*) from o where status = 'batal'),
    'from_customer', (select count(*) from ok where source = 'pelanggan'),
    'from_waiter', (select count(*) from ok where source = 'pelayan'),
    'tables_used', (select count(distinct table_id) from ok),
    'with_options_or_notes', (select count(distinct ok.id) from ok join public.order_items oi on oi.order_id = ok.id
                              where jsonb_array_length(oi.options) > 0 or oi.note is not null or ok.note is not null),
    'prev_orders', (select count(*) from public.orders where outlet_id = p_outlet and status <> 'batal'
                    and created_at >= t0 - interval '7 days' and created_at < t0),
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
grant execute on function public.weekly_report(uuid, date) to authenticated;

-- ---------------- Penyediaan outlet (BinaLab sahaja, melalui SQL Editor) ----------------
-- Contoh:
--   select public.create_outlet('Syarikat Ali', 'Kafe Ali Kota Bharu', 'kafe-ali-kb', 'ali@email.com', 'smart', 8);
--   select public.add_staff('kafe-ali-kb', 'kru1@email.com', 'kru');
create or replace function public.create_outlet(
  p_company text, p_outlet text, p_slug text, p_owner_email text default null, p_plan text default 'lite', p_tables int default 0
)
returns uuid
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_company uuid;
  v_outlet uuid;
  v_user uuid;
begin
  select id into v_company from public.companies where name = p_company;
  if v_company is null then
    insert into public.companies (name) values (p_company) returning id into v_company;
  end if;
  insert into public.outlets (company_id, slug, name, plan) values (v_company, lower(p_slug), p_outlet, p_plan)
  returning id into v_outlet;
  if p_owner_email is not null then
    select id into v_user from auth.users where lower(email) = lower(p_owner_email);
    if v_user is null then raise exception 'Pengguna % belum wujud. Cipta di Authentication > Users dahulu.', p_owner_email; end if;
    insert into public.memberships (user_id, company_id, role) values (v_user, v_company, 'owner') on conflict do nothing;
  end if;
  insert into public.dining_tables (outlet_id, label, sort_order)
    select v_outlet, n::text, n from generate_series(1, greatest(p_tables, 0)) n;
  return v_outlet;
end;
$$;

create or replace function public.add_staff(p_slug text, p_email text, p_role text default 'kru')
returns void
language plpgsql volatile security definer set search_path = public
as $$
declare
  o public.outlets;
  v_user uuid;
begin
  select * into o from public.outlets where slug = lower(p_slug);
  if not found then raise exception 'Outlet % tidak dijumpai.', p_slug; end if;
  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then raise exception 'Pengguna % belum wujud. Cipta di Authentication > Users dahulu.', p_email; end if;
  insert into public.memberships (user_id, company_id, outlet_id, role)
  values (v_user, o.company_id, o.id, p_role) on conflict do nothing;
end;
$$;
revoke all on function public.create_outlet(text, text, text, text, text, int) from public, anon, authenticated;
revoke all on function public.add_staff(text, text, text) from public, anon, authenticated;

-- ---------------- Storage gambar: folder ikut outlet ({outlet_id}/fail.jpg) ----------------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "public read menu images" on storage.objects;
create policy "public read menu images" on storage.objects for select using (bucket_id = 'menu-images');
drop policy if exists "owner upload menu images" on storage.objects;
create policy "owner upload menu images" on storage.objects for insert
  with check (bucket_id = 'menu-images' and public.is_outlet_owner(nullif(split_part(name, '/', 1), '')::uuid));
drop policy if exists "owner update menu images" on storage.objects;
create policy "owner update menu images" on storage.objects for update
  using (bucket_id = 'menu-images' and public.is_outlet_owner(nullif(split_part(name, '/', 1), '')::uuid));
drop policy if exists "owner delete menu images" on storage.objects;
create policy "owner delete menu images" on storage.objects for delete
  using (bucket_id = 'menu-images' and public.is_outlet_owner(nullif(split_part(name, '/', 1), '')::uuid));

-- ---------------- Realtime untuk skrin kru ----------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
