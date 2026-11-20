# Digital Menu (NFC)

Menu digital untuk satu kedai makan / kafe. Pelanggan tap NFC tag (atau imbas QR) pada stand → menu terus terbuka di telefon.

- **Menu awam** (`/`): mesra telefon, carian, kategori melekit, tanda *Popular* & *Habis*, nombor meja dari `?meja=5`.
- **4 template UI** boleh dipilih di *Tetapan kedai*: **Klasik**, **Kafe** (kad bergambar), **Premium** (gelap & serif), **Warung** (tebal & terang).
- **Dashboard admin** (`/admin`): tambah/edit item & gambar, kategori, tetapan kedai (logo, warna, waktu operasi), dan pautan + QR untuk NFC setiap meja.
- **Teknologi:** Next.js 15, Tailwind CSS 4, Supabase (Postgres, Auth, Storage).

## 1. Sediakan Supabase (satu projek untuk semua outlet)

1. Daftar di <https://supabase.com> → **New project** (region **Singapore**).
2. **SQL Editor** → tampal `supabase/schema.sql` → **Run**. (Pilihan: `supabase/seed.sql` untuk outlet contoh `kafe-contoh`.)
3. **Authentication → Sign In / Providers**: matikan *Allow new users to sign up*.
4. Untuk setiap pelanggan baru, cipta akaun owner di **Authentication → Users → Add user**, kemudian dalam SQL Editor:
   ```sql
   -- syarikat, nama outlet, slug, e-mel owner, pelan ('lite' RM29 | 'smart' RM69), bilangan meja
   select public.create_outlet('Syarikat Ali', 'Kafe Ali Kota Bharu', 'kafe-ali-kb', 'ali@email.com', 'smart', 8);
   -- kru (cipta pengguna dahulu)
   select public.add_staff('kafe-ali-kb', 'kru1@email.com', 'kru');
   -- tukar pelan
   update public.outlets set plan = 'lite' where slug = 'kafe-ali-kb';
   ```
   Owner syarikat nampak semua outlet syarikatnya (pemilih outlet di atas halaman admin). Kru hanya nampak outlet yang ditambah.

> Schema ini untuk projek baru. Ia menggantikan schema satu-outlet yang lama dan tidak menaik taraf data lama.

## 2. Jalankan di komputer

```bash
cp .env.example .env.local   # isi URL & anon key dari Project Settings → API
npm install
npm run dev
```

Buka <http://localhost:3000> (menu) dan <http://localhost:3000/admin> (dashboard).

## 3. Deploy ke Vercel (percuma)

1. Push projek ini ke GitHub.
2. Di <https://vercel.com> → **Add New Project** → pilih repo.
3. Tambah Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (cth. `https://menu.kedaianda.com`, untuk pautan NFC/QR)
4. **Deploy**. Sambungkan domain sendiri di *Settings → Domains* jika mahu.

## 4. Sediakan sticker meja (BinaLab)

1. Log masuk sebagai owner outlet → **Meja & NFC**. Setiap meja ada pautan `/t/{kod}`.
2. **Muat turun sticker** (setiap meja, SVG dengan bleed 3mm untuk kedai cetak) atau **Cetak semua sticker** (A4, 10 sehelai, saiz sebenar 85.6 × 54mm, cetak pada skala **100%**).
3. Tulis pautan meja ke tag NFC dengan app **NFC Tools**: *Write* → *Add a record* → *URL* → tampal → tap tag. Kemudian *Other → Lock tag*.
4. Tampal tag di belakang sticker, uji tap dan imbas QR untuk setiap meja sebelum pos.

Tag disyorkan: **NTAG213** (cukup untuk satu URL). Jika permukaan logam, guna tag *anti-metal*.

## Pelan

| | Lite RM29/bulan | Smart RM69/bulan |
|---|---|---|
| Menu `/t/{kod}` dan `/m/{slug}` | ✓ | ✓ |
| Pesanan dari meja, skrin kru `/kru`, mod pelayan `/kru/pesan` | | ✓ |
| Laporan penggunaan mingguan | | ✓ |

Sticker meja: RM5 setiap satu, saiz kad bank (85.6 × 54mm), design standard, tag NFC di belakang.
Fail dijana di **Admin → Meja & NFC** (satu fail setiap meja, atau helaian A4 10 sticker).

**Bukan POS:** Bina Menu tidak mengira duit, merekod jualan, membatalkan pesanan atau mengurus stok.
Kru nampak meja, item dan catatan, kemudian tekan **Selesai**. Bayaran dan jualan kekal dalam POS atau kaunter kedai.
Harga dan pilihan setiap pesanan dikira semula dalam pangkalan data (`place_order`), bukan di telefon pelanggan.

| Halaman | Siapa | Fungsi |
|---|---|---|
| `/t/{kod}` | Pelanggan | Menu meja; Smart: pilih item & pilihan, troli, hantar pesanan, lihat status |
| `/m/{slug}` | Pelanggan | Menu umum outlet (tanpa meja, tanpa pesanan) |
| `/kru` | Kru & owner | Pesanan baru masa nyata, bunyi loceng, Selesai, senarai baru selesai |
| `/kru/pesan` | Kru & owner | Mod pelayan |
| `/admin/...` | Owner | Menu, kategori, meja & sticker, laporan penggunaan, tetapan kedai |

## Struktur

```
app/page.tsx                 Halaman utama domain app
app/m/[slug]/                Menu umum outlet
app/t/[code]/                Menu meja + pesanan pelanggan (Smart)
app/kru/                     Skrin kru dan mod pelayan
components/order/            Troli, pilihan item, pengesahan pesanan
components/kru/CrewBoard.tsx Skrin kru masa nyata
app/menu-templates.css       Gaya setiap template (Klasik, Kafe, Premium, Warung)
lib/sticker.ts               Sticker meja saiz kad bank (nama kedai + QR + nombor meja)
lib/staff.ts                 Outlet yang dipilih dan peranan pengguna
lib/templates.ts             Senarai template yang boleh dipilih
app/admin/actions.ts         Semua server actions (simpan, padam, muat naik)
app/admin/(dashboard)/       Halaman admin: menu, kategori, meja & NFC, laporan, tetapan
components/MenuView.tsx      UI menu pelanggan
supabase/schema.sql          Jadual, RLS & storage bucket
middleware.ts                Lindungi /admin
```

**Keselamatan:** Row Level Security mengasingkan data ikut outlet. Orang awam hanya boleh *baca* menu outlet aktif; owner hanya boleh ubah outlet syarikatnya; kru hanya nampak pesanan outlet yang ditambah (jadual `memberships`). Jangan sesekali letak `service_role` key dalam projek ini.
