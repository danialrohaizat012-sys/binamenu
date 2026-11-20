import { formatPrice } from "@/lib/format";
import { dateMyt } from "@/lib/time";

export type WeeklyReport = {
  start: string;
  end: string;
  orders: number;
  cancelled: number;
  revenue: number;
  from_customer: number;
  from_waiter: number;
  tables_used: number;
  avg_minutes_to_done: number | null;
  with_options_or_notes: number;
  prev_orders: number;
  by_day: { day: string; orders: number }[];
  by_hour: { hour: number; orders: number }[];
  top_items: { name: string; qty: number }[];
};

export const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

export function busiest(r: WeeklyReport) {
  const day = [...r.by_day].sort((a, b) => b.orders - a.orders)[0];
  const hour = [...r.by_hour].sort((a, b) => b.orders - a.orders)[0];
  return {
    day: day ? dateMyt(day.day, { weekday: "long" }) : null,
    hour: hour ? `${hour.hour}:00–${hour.hour + 1}:00` : null,
  };
}

// Teks ringkas untuk dihantar ke WhatsApp owner
export function reportText(shop: string, r: WeeklyReport) {
  const b = busiest(r);
  const change = r.prev_orders ? ` (minggu lepas ${r.prev_orders})` : "";
  return [
    `Laporan Bina Menu · ${shop}`,
    `${dateMyt(r.start)} – ${dateMyt(r.end)}`,
    "",
    `🧾 Pesanan: ${r.orders}${change}`,
    `💵 Jualan melalui Bina Menu: ${formatPrice(r.revenue)}`,
    `📱 Dari pelanggan ${pct(r.from_customer, r.orders)}% · pelayan ${pct(r.from_waiter, r.orders)}%`,
    r.avg_minutes_to_done != null ? `⏱️ Purata siap: ${r.avg_minutes_to_done} minit` : null,
    `📝 Pesanan dengan pilihan/catatan: ${r.with_options_or_notes}`,
    b.day ? `🔥 Paling sibuk: ${b.day}, ${b.hour}` : null,
    r.top_items.length ? `🏆 ${r.top_items.slice(0, 3).map((i) => `${i.name} (${i.qty})`).join(", ")}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// Nombor telefon kedai → format wa.me (60...)
export function waNumber(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("0") ? `6${digits}` : digits;
}
