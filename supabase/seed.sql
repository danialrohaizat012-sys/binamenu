-- Data contoh (pilihan): satu outlet "Kafe Contoh" dengan 6 meja, pelan Smart, tanpa owner.
-- Untuk outlet sebenar guna public.create_outlet(...) dengan e-mel owner.
do $$
declare
  v_outlet uuid;
  c_food uuid;
  c_drink uuid;
  c_dessert uuid;
begin
  if exists (select 1 from public.outlets where slug = 'kafe-contoh') then return; end if;
  v_outlet := public.create_outlet('Syarikat Contoh', 'Kafe Contoh', 'kafe-contoh', null, 'smart', 6);
  update public.outlets set tagline = 'Kopi, nasi lemak & manisan',
    opening_hours = 'Isnin - Sabtu, 8:00 pagi - 10:00 malam', phone = '012-345 6789'
  where id = v_outlet;

  insert into public.categories (outlet_id, name, sort_order) values (v_outlet, 'Makanan', 1) returning id into c_food;
  insert into public.categories (outlet_id, name, sort_order) values (v_outlet, 'Minuman', 2) returning id into c_drink;
  insert into public.categories (outlet_id, name, sort_order) values (v_outlet, 'Pencuci Mulut', 3) returning id into c_dessert;

  insert into public.menu_items (outlet_id, category_id, name, description, price, is_popular, sort_order, options) values
    (v_outlet, c_food, 'Nasi Lemak Ayam Goreng', 'Nasi lemak, ayam goreng berempah, sambal, telur & kacang', 12.90, true, 1,
      '[{"name":"Pedas","required":false,"multi":false,"choices":[{"name":"Sambal asing","price":0},{"name":"Extra sambal","price":1}]}]'),
    (v_outlet, c_food, 'Mee Goreng Mamak', 'Mee kuning goreng dengan sayur, tauhu & telur', 9.50, false, 2,
      '[{"name":"Pedas","required":true,"multi":false,"choices":[{"name":"Tak pedas","price":0},{"name":"Sederhana","price":0},{"name":"Pedas","price":0}]}]'),
    (v_outlet, c_food, 'Roti Canai', 'Dihidang bersama kuah dhal & kari', 2.00, false, 3, '[]'),
    (v_outlet, c_drink, 'Teh Tarik', 'Panas atau ais', 3.50, true, 1,
      '[{"name":"Gula","required":true,"multi":false,"choices":[{"name":"Biasa","price":0},{"name":"Kurang manis","price":0},{"name":"Tanpa gula","price":0}]},{"name":"Suhu","required":true,"multi":false,"choices":[{"name":"Panas","price":0},{"name":"Ais","price":0.5}]}]'),
    (v_outlet, c_drink, 'Kopi O', 'Kopi tempatan pekat', 2.80, false, 2,
      '[{"name":"Suhu","required":true,"multi":false,"choices":[{"name":"Panas","price":0},{"name":"Ais","price":0.5}]}]'),
    (v_outlet, c_drink, 'Sirap Bandung', 'Sirap mawar dengan susu', 4.00, false, 3, '[]'),
    (v_outlet, c_dessert, 'Cendol', 'Santan, gula melaka & cendol pandan', 6.50, false, 1, '[]'),
    (v_outlet, c_dessert, 'Pisang Goreng Cheese', 'Pisang goreng rangup dengan cheese & susu pekat', 7.90, true, 2, '[]');
end $$;
