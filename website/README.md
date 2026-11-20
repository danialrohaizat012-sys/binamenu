# Website Bina Menu (binamenu.binalab.my)

Satu halaman statik (HTML + CSS + sedikit JavaScript). Tiada build, tiada pakej.

## Sebelum go-live

1. Buka `index.html`, cari `WHATSAPP_NUMBER` dan isi nombor WhatsApp BinaLab (format `60123456789`).
   Borang demo dan semua butang "Tempah demo" menghantar pelanggan ke WhatsApp ini.
2. Isi `STRIPE_LINKS` (Lite dan Smart) dengan Stripe Payment Link. Selagi kosong, butang
   "Bayar & pos" menghantar pelanggan ke WhatsApp. Cadangan tetapan setiap Payment Link:
   - Item 1: langganan bulanan pelan (RM50 Lite / RM89 Smart).
   - Item 2: "Set sticker NFC" RM20 sekali bayar, **kuantiti boleh diubah** dengan minimum 4.
   - Hidupkan **kumpul alamat penghantaran** dan tambah kadar pos.
   - Tambah medan custom untuk nama kedai dan senarai meja.
   Sahkan dengan Stripe bahawa langganan dan item sekali bayar boleh digabung dalam satu Payment Link untuk akaun anda.
3. Tetapkan kadar caj pemasangan Kota Bharu (sekarang laman hanya sebut "ikut jarak").
4. Tambah logo rasmi BinaLab jika mahu (sekarang hanya teks "Bina Menu oleh BinaLab").
5. Pastikan fungsi yang disebut dalam pelan Smart (pesanan meja, mod pelayan, pilihan item,
   laporan mingguan) sudah boleh didemo sebelum laman ini diiklankan.

## Deploy ke Vercel dengan subdomain

1. Vercel → **Add New Project** → pilih repo `binamenu`.
2. **Root Directory**: `website`. Framework Preset: **Other**. Tiada build command.
3. Deploy, kemudian **Settings → Domains** → tambah `binamenu.binalab.my`.
4. Di pengurus DNS `binalab.my`, tambah rekod **CNAME**: nama `binamenu`, nilai seperti yang Vercel tunjukkan (biasanya `cname.vercel-dns.com`).

App Bina Menu (menu pelanggan, admin, skrin kru) ialah projek Vercel yang berasingan daripada website ini.
