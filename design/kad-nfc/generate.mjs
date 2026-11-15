// Jana design kad NFC BinaMenu (CR80 85.6 x 54mm) sebagai PDF & PNG sedia cetak.
// Guna: node design/kad-nfc/generate.mjs --name "Kafe Contoh" --url https://menu.kedai.com --meja 5 --out ./kad
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");
const { chromium } = require("playwright");

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const name = arg("name", "Kafe Contoh");
const base = arg("url", "https://menu.kafecontoh.com");
const meja = arg("meja", "");
const out = arg("out", join(here, "output"));
const url = meja ? `${base}/?meja=${encodeURIComponent(meja)}` : base;

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
const n = qr.modules.size;
let qrPath = "";
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) qrPath += `M${c} ${r}h1v1h-1z`;
const qrSvg = `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path d="${qrPath}" fill="#1C1410"/></svg>`;
const mark = readFileSync(join(here, "../../public/brand/binamenu-mark.svg"), "utf8");

const html = readFileSync(join(here, "template.html"), "utf8")
  .replaceAll("{{NAME}}", esc(name.toUpperCase()))
  .replaceAll("{{MEJA}}", esc(meja ? `MEJA ${meja}` : "MENU DIGITAL"))
  .replaceAll("{{QR}}", qrSvg)
  .replaceAll("{{MARK}}", mark);

mkdirSync(out, { recursive: true });
const file = meja ? `kad-meja-${meja}` : "kad-umum";
writeFileSync(join(out, `${file}.html`), html);

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
const browser = await chromium.launch(proxy ? { proxy } : {});
const page = await browser.newPage({ deviceScaleFactor: 600 / 96 });
await page.goto("file://" + join(out, `${file}.html`), { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// PDF 2 muka surat (depan & belakang) dengan bleed 3mm: 91.6 x 60mm
await page.pdf({ path: join(out, `${file}.pdf`), width: "91.6mm", height: "60mm", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
for (const side of ["depan", "belakang"]) {
  await page.locator(`#${side}`).screenshot({ path: join(out, `${file}-${side}.png`) });
}
await browser.close();
console.log(`Siap: ${join(out, file)}.pdf / -depan.png / -belakang.png  (${url})`);
