# Website Bina Menu (binamenu.binalab.my)

Satu halaman statik (HTML + CSS + sedikit JavaScript). Tiada build, tiada pakej.

## Sebelum go-live

1. Buka `index.html`, cari `WHATSAPP_NUMBER` dan isi nombor WhatsApp BinaLab (format `60123456789`).
   Borang demo dan semua butang "Tempah demo" menghantar pelanggan ke WhatsApp ini.
2. Tambah logo rasmi BinaLab jika mahu (sekarang hanya teks "Bina Menu oleh BinaLab").
3. Pastikan fungsi yang disebut dalam pelan Smart (pesanan meja, mod pelayan, pilihan item,
   laporan mingguan) sudah boleh didemo sebelum laman ini diiklankan.

## Deploy ke Vercel dengan subdomain

1. Vercel → **Add New Project** → pilih repo `binamenu`.
2. **Root Directory**: `website`. Framework Preset: **Other**. Tiada build command.
3. Deploy, kemudian **Settings → Domains** → tambah `binamenu.binalab.my`.
4. Di pengurus DNS `binalab.my`, tambah rekod **CNAME**: nama `binamenu`, nilai seperti yang Vercel tunjukkan (biasanya `cname.vercel-dns.com`).

App Bina Menu (menu pelanggan, admin, skrin kru) ialah projek Vercel yang berasingan daripada website ini.
