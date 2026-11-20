import QRCode from "qrcode";

// Sticker meja default Bina Menu: saiz kad bank (CR80), melintang. Tag NFC ditampal di belakang.
// Design sama untuk semua outlet supaya mudah dicetak pukal; hanya nama kedai, QR dan nombor meja berbeza.
export const STICKER_W = 85.6;
export const STICKER_H = 54;
export const BLEED_MM = 3;

const NAVY = "#0f2347";
const GREEN = "#12a36b";

type StickerOptions = {
  name: string;
  url: string;
  table?: string | null;
  // true: fail untuk kedai cetak (bleed 3mm). false: saiz sebenar dengan garis potong untuk cetak sendiri.
  bleed?: boolean;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function qrPath(url: string, x: number, y: number, size: number) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const cell = size / n;
  let d = "";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.modules.get(r, c)) d += `M${(x + c * cell).toFixed(3)} ${(y + r * cell).toFixed(3)}h${cell.toFixed(3)}v${cell.toFixed(3)}h-${cell.toFixed(3)}z`;
  return d;
}

export function stickerSvg({ name, url, table, bleed = true }: StickerOptions) {
  const b = BLEED_MM;
  const W = STICKER_W + b * 2;
  const H = STICKER_H + b * 2;
  const shop = name.trim().toUpperCase() || "MENU";
  const shopSize = Math.min(2.6, 40 / (shop.length * 0.8)); // muat dalam panel kiri (~40mm)
  const label = table ? `MEJA ${table}` : "MENU";

  // Panel QR di kanan (hijau sampai ke tepi bleed)
  const panelX = b + 52;
  const qrSize = 24;
  const qrX = panelX + (STICKER_W - 52 - qrSize) / 2;
  const qrY = b + 7;

  const viewBox = bleed ? `0 0 ${W} ${H}` : `${b - 0.5} ${b - 0.5} ${STICKER_W + 1} ${STICKER_H + 1}`;
  const w = bleed ? W : STICKER_W + 1;
  const h = bleed ? H : STICKER_H + 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="${viewBox}">
  <g font-family="Arial, Helvetica, sans-serif" font-weight="700">
    <rect width="${W}" height="${H}" fill="${NAVY}"/>
    <rect x="${panelX}" y="0" width="${W - panelX}" height="${H}" fill="${GREEN}"/>
    <rect x="${qrX - 1.6}" y="${qrY - 1.6}" width="${qrSize + 3.2}" height="${qrSize + 3.2}" rx="2" fill="#fff"/>
    <path d="${qrPath(url, qrX, qrY, qrSize)}" fill="${NAVY}"/>
    <rect x="${panelX + 5}" y="${b + 37}" width="${STICKER_W - 52 - 10}" height="7.5" rx="3.75" fill="#fff"/>
    <text x="${panelX + (STICKER_W - 52) / 2}" y="${b + 42.4}" text-anchor="middle" font-size="4" fill="${NAVY}" letter-spacing="0.3">${esc(label)}</text>

    <text x="${b + 6}" y="${b + 9}" font-size="${shopSize.toFixed(2)}" fill="#9fb3d9" letter-spacing="0.3">${esc(shop)}</text>
    <g fill="none" stroke="#fff" stroke-width="0.9" stroke-linecap="round">
      <path d="M${b + 7} ${b + 17}a3 3 0 0 1 0 6"/><path d="M${b + 9.5} ${b + 14.5}a6.5 6.5 0 0 1 0 11"/><path d="M${b + 12} ${b + 12}a10 10 0 0 1 0 16"/>
    </g>
    <text x="${b + 6}" y="${b + 36}" font-size="7.2" fill="#fff">Tap atau</text>
    <text x="${b + 6}" y="${b + 43.5}" font-size="7.2" fill="${GREEN}">imbas</text>
    <text x="${b + 6}" y="${b + 49}" font-size="2.6" font-weight="400" fill="#c4cfe4">untuk lihat menu · Bina Menu</text>
  </g>
  ${bleed ? "" : `<rect x="${b}" y="${b}" width="${STICKER_W}" height="${STICKER_H}" rx="3.2" fill="none" stroke="#a8a29e" stroke-width="0.15" stroke-dasharray="1 0.8"/>`}
</svg>`;
}
