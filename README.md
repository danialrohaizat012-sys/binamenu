# Digital Menu (NFC)

Menu digital untuk satu kedai makan / kafe. Pelanggan tap NFC tag (atau imbas QR) pada stand → menu terus terbuka di telefon.

- **Menu awam** (`/`): mesra telefon, carian, kategori melekit, tanda *Popular* & *Habis*, nombor meja dari `?meja=5`.
- **4 template UI** boleh dipilih di *Tetapan kedai*: **Klasik**, **Kafe** (kad bergambar), **Premium** (gelap & serif), **Warung** (tebal & terang).
- **Dashboard admin** (`/admin`): tambah/edit item & gambar, kategori, tetapan kedai (logo, warna, waktu operasi), dan pautan + QR untuk NFC setiap meja.
- **Teknologi:** Next.js 15, Tailwind CSS 4, Supabase (Postgres, Auth, Storage).

## 1. Sediakan Supabase

1. Daftar di <https://supabase.com> → **New project** (pilih region **Singapore** supaya laju di Malaysia).
2. Buka **SQL Editor** → tampal isi `supabase/schema.sql` → **Run**.
3. (Pilihan) Tampal `supabase/seed.sql` → **Run** untuk data contoh.
4. **Authentication → Users → Add user**: masukkan emel & kata laluan admin (tandakan *Auto Confirm User*).
5. Salin **User UID** pengguna tadi, kemudian jalankan dalam SQL Editor:
   ```sql
   insert into public.admins (user_id) values ('PASTE-USER-UID-DI-SINI');
   ```
6. **Authentication → Sign In / Providers**: matikan *Allow new users to sign up* supaya orang lain tak boleh daftar.

> **Dah jalankan schema.sql versi lama?** Jalankan semula `supabase/schema.sql`. Ia selamat dijalankan berulang kali dan akan menambah lajur `template` tanpa memadam data.

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

## 4. Tulis NFC tag

1. Log masuk `/admin` → **NFC & QR**, masukkan bilangan meja.
2. Pasang app **NFC Tools** (Android/iPhone) → *Write* → *Add a record* → *URL* → tampal pautan meja → *Write* → tap tag.
3. Disyorkan: *Other → Lock tag* selepas siap, supaya tag tak boleh ditulis semula oleh orang lain.
4. Cetak QR dari halaman yang sama dan tampal pada stand sebagai backup.

Tag disyorkan: **NTAG213** (cukup untuk satu URL). Jika stand logam, guna tag *anti-metal*.

## Struktur

```
app/page.tsx                 Menu awam (statik, dikemas kini bila admin simpan)
app/menu-templates.css       Gaya setiap template (Klasik, Kafe, Premium, Warung)
lib/templates.ts             Senarai template yang boleh dipilih
app/admin/actions.ts         Semua server actions (simpan, padam, muat naik)
app/admin/(dashboard)/       Halaman admin: menu, kategori, tetapan, NFC & QR
components/MenuView.tsx      UI menu pelanggan
supabase/schema.sql          Jadual, RLS & storage bucket
middleware.ts                Lindungi /admin
```

**Keselamatan:** Row Level Security memastikan orang awam hanya boleh *baca* menu; hanya pengguna dalam jadual `admins` boleh ubah. Jangan sesekali letak `service_role` key dalam projek ini.
