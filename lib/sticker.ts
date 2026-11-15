import QRCode from "qrcode";

// Sticker bulat 3 inci (76.2mm). Semua ukuran dalam milimeter.
export const STICKER_MM = 76.2;
export const BLEED_MM = 3;

type StickerOptions = {
  name: string;
  url: string;
  table?: string | null;
  color: string;
  // true: fail untuk kedai cetak (ada bleed 3mm). false: saiz sebenar untuk cetak sendiri.
  bleed?: boolean;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Anggaran lebar teks Arial Bold, untuk muatkan nama kedai yang panjang
const textWidth = (text: string, size: number) => text.length * size * 0.7;

function qrPath(url: string, x: number, y: number, size: number) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const cell = size / n;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) d += `M${(x + c * cell).toFixed(3)} ${(y + r * cell).toFixed(3)}h${cell.toFixed(3)}v${cell.toFixed(3)}h-${cell.toFixed(3)}z`;
    }
  }
  return d;
}

// Ikon gelombang contactless, berpusat pada (x, y)
function nfcIcon(x: number, y: number, color: string) {
  const arcs = [1.1, 2.1, 3.1]
    .map((r) => `<path d="M${x - 1.2 + r * 0.35} ${y - r} a${r} ${r} 0 0 1 0 ${r * 2}" />`)
    .join("");
  return `<g fill="none" stroke="${color}" stroke-width="0.55" stroke-linecap="round">${arcs}</g>`;
}

export function stickerSvg({ name, url, table, color, bleed = true }: StickerOptions) {
  const full = STICKER_MM + BLEED_MM * 2;
  const c = full / 2;
  const R = STICKER_MM / 2;
  const inner = R - 3.6; // bulatan putih dalam; cincin warna 3.6mm di tepi
  const dark = "#1c1917";

  const title = name.trim().toUpperCase() || "MENU";
  const titleSize = Math.min(3.6, 36 / (title.length * 0.7));

  const tapText = "TAP UNTUK MENU";
  const tapSize = 4;
  const tapX = c + 2.6; // ruang untuk ikon di kiri
  const iconX = tapX - textWidth(tapText, tapSize) / 2 - 2.6;

  const qrSize = 25;
  const qrX = c - qrSize / 2;
  const qrY = c - 13.2;

  const pillLabel = table ? `MEJA ${table}` : "MENU DIGITAL";
  const pillSize = table ? 3.6 : 2.8;
  const pillW = textWidth(pillLabel, pillSize) + 7;
  const pillY = c + 18.2;

  // Tanpa bleed: beri ruang 0.5mm supaya garis potong bulat tidak terpotong di tepi
  const pad = BLEED_MM - 0.5;
  const viewBox = bleed ? `0 0 ${full} ${full}` : `${pad} ${pad} ${STICKER_MM + 1} ${STICKER_MM + 1}`;
  const size = bleed ? full : STICKER_MM + 1;
  // Id ikut geometri, supaya banyak sticker dalam satu halaman tidak bercanggah
  const clipId = bleed ? "sticker-cut-bleed" : "sticker-cut";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}mm" height="${size}mm" viewBox="${viewBox}">
  <defs><clipPath id="${clipId}"><circle cx="${c}" cy="${c}" r="${bleed ? c : R}" /></clipPath></defs>
  <g clip-path="url(#${clipId})" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">
    <rect width="${full}" height="${full}" fill="${color}" />
    <circle cx="${c}" cy="${c}" r="${inner}" fill="#ffffff" />
    <text x="${c}" y="${c - 22.6}" font-size="${titleSize.toFixed(2)}" fill="${color}" letter-spacing="0.25">${esc(title)}</text>
    ${nfcIcon(iconX, c - 16.9, dark)}
    <text x="${tapX}" y="${c - 15.5}" font-size="${tapSize}" fill="${dark}">${tapText}</text>
    <path d="${qrPath(url, qrX, qrY, qrSize)}" fill="${dark}" />
    <text x="${c}" y="${c + 15.4}" font-size="2.3" font-weight="400" fill="#57534e">Tap telefon di sini atau imbas QR</text>
    <rect x="${c - pillW / 2}" y="${pillY}" width="${pillW}" height="${pillSize + 2.6}" rx="${(pillSize + 2.6) / 2}" fill="${color}" />
    <text x="${c}" y="${pillY + pillSize + 0.75}" font-size="${pillSize}" fill="#ffffff" letter-spacing="0.3">${esc(pillLabel)}</text>
  </g>
  ${bleed ? "" : `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#a8a29e" stroke-width="0.15" stroke-dasharray="1 0.8" />`}
</svg>`;
}
