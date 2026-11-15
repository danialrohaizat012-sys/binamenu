# Kad NFC BinaMenu

Design kad NFC saiz standard **CR80 (85.6 × 54mm)**, sama saiz kad bank / kad PVC NFC kosong.

- **Depan:** nama kedai, "Tap untuk menu.", nombor meja, QR code, "Dikuasakan oleh BinaMenu".
- **Belakang:** branding BinaMenu.

## Jana kad

```bash
node design/kad-nfc/generate.mjs --name "Nama Kedai" --url https://menu.kedaianda.com --meja 5
node design/kad-nfc/generate.mjs --name "Nama Kedai" --url https://menu.kedaianda.com   # kad umum tanpa meja
```

Hasil dalam `design/kad-nfc/output/`:
- `kad-meja-5.pdf`: 2 muka surat (depan, belakang), 91.6 × 60mm termasuk **bleed 3mm**. Hantar fail ini ke kedai cetak.
- `kad-meja-5-depan.png`, `kad-meja-5-belakang.png`: pratonton 600 dpi.

Perlu Playwright dengan Chromium, dan sambungan internet untuk font Google (Poppins, Plus Jakarta Sans).

## Nota cetak

- Cetak terus atas **kad PVC NFC kosong (NTAG213/215)**. Kebanyakan kedai cetak kad yang jual kad NFC boleh buat.
- Minta sudut bulat (radius 3mm), cetakan dua muka, kemasan matte atau gloss.
- Logo: `public/brand/binamenu-mark.svg`.
