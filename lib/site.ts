import { headers } from "next/headers";

// URL awam menu, untuk pautan NFC & QR
export async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

// Pautan meja yang ditulis ke tag NFC dan QR. Tanpa kod: menu umum.
export function tableUrl(base: string, code?: string | null) {
  return code ? `${base}/t/${encodeURIComponent(code)}` : base;
}
