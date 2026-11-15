import { headers } from "next/headers";

// URL awam menu, untuk pautan NFC & QR
export async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export function tableUrl(base: string, table?: string | null) {
  return table ? `${base}/?meja=${encodeURIComponent(table)}` : base;
}
