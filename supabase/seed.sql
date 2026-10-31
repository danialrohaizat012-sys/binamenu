-- Data contoh (pilihan). Boleh padam kemudian dari dashboard admin.
update public.settings set
  name = 'Kafe Contoh',
  tagline = 'Kopi, nasi lemak & manisan',
  opening_hours = 'Isnin - Sabtu, 8:00 pagi - 10:00 malam',
  phone = '012-345 6789'
where id = 1;

with c as (
  insert into public.categories (name, sort_order) values
    ('Makanan', 1), ('Minuman', 2), ('Pencuci Mulut', 3)
  returning id, name
)
insert into public.menu_items (category_id, name, description, price, is_popular, sort_order)
select c.id, v.name, v.description, v.price, v.popular, v.sort
from c join (values
  ('Makanan', 'Nasi Lemak Ayam Goreng', 'Nasi lemak, ayam goreng berempah, sambal, telur & kacang', 12.90, true, 1),
  ('Makanan', 'Mee Goreng Mamak', 'Mee kuning goreng dengan sayur, tauhu & telur', 9.50, false, 2),
  ('Makanan', 'Roti Canai', 'Dihidang bersama kuah dhal & kari', 2.00, false, 3),
  ('Minuman', 'Teh Tarik', 'Panas atau ais', 3.50, true, 1),
  ('Minuman', 'Kopi O', 'Kopi tempatan pekat', 2.80, false, 2),
  ('Minuman', 'Sirap Bandung', 'Sirap mawar dengan susu', 4.00, false, 3),
  ('Pencuci Mulut', 'Cendol', 'Santan, gula melaka & cendol pandan', 6.50, false, 1),
  ('Pencuci Mulut', 'Pisang Goreng Cheese', 'Pisang goreng rangup dengan cheese & susu pekat', 7.90, true, 2)
) as v(cat, name, description, price, popular, sort) on v.cat = c.name;
