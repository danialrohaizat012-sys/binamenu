import Link from "next/link";
import CopyButton from "@/components/CopyButton";
import Notice from "@/components/Notice";
import { busiest, pct, reportText, waNumber, type WeeklyReport } from "@/lib/report";
import { requireOwner } from "@/lib/staff";
import { addDays, dateMyt, mondayMyt } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ mula?: string }> }) {
  const { mula } = await searchParams;
  const thisWeek = mondayMyt();
  const start = mula && /^\d{4}-\d{2}-\d{2}$/.test(mula) ? mondayMyt(new Date(`${mula}T12:00:00+08:00`)) : thisWeek;

  const { supabase, outlet } = await requireOwner();
  const [{ data, error }, { data: settings }] = await Promise.all([
    supabase.rpc("weekly_report", { p_outlet: outlet.id, p_start: start }),
    supabase.from("outlets").select("name, phone").eq("id", outlet.id).single(),
  ]);
  const r = data as WeeklyReport | null;
  const text = r ? reportText(settings?.name ?? "Kedai", r) : "";
  const phone = waNumber(settings?.phone ?? null);
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  const b = r ? busiest(r) : null;
  const maxHour = r ? Math.max(1, ...r.by_hour.map((h) => h.orders)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Laporan penggunaan</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link href={`/admin/laporan?mula=${addDays(start, -7)}`} className="btn-secondary px-3 py-1.5">← Minggu lepas</Link>
          <span className="font-medium">
            {dateMyt(start)} – {dateMyt(addDays(start, 6))}
          </span>
          {start < thisWeek && (
            <Link href={`/admin/laporan?mula=${addDays(start, 7)}`} className="btn-secondary px-3 py-1.5">Minggu depan →</Link>
          )}
        </div>
      </div>

      <Notice error={error ? `Laporan tidak dapat dimuat: ${error.message}` : undefined} />

      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              ["Pesanan melalui Bina Menu", String(r.orders), r.prev_orders ? `minggu lepas ${r.prev_orders}` : "minggu lepas tiada"],
              ["Dari meja (pelanggan)", String(r.from_customer), `${pct(r.from_customer, r.orders)}% daripada semua pesanan`],
              ["Dengan pilihan/catatan", String(r.with_options_or_notes), "kurang manis, tak nak sayur…"],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs text-stone-500">{label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
                <p className="text-xs text-stone-500">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="font-semibold">Siapa yang masukkan order</h2>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-stone-100">
                <div className="bg-emerald-500" style={{ width: `${pct(r.from_customer, r.orders)}%` }} />
                <div className="bg-[#0f2347]" style={{ width: `${pct(r.from_waiter, r.orders)}%` }} />
              </div>
              <p className="mt-2 text-sm text-stone-600">
                Pelanggan {r.from_customer} ({pct(r.from_customer, r.orders)}%) · Pelayan {r.from_waiter} ({pct(r.from_waiter, r.orders)}%) · {r.tables_used} meja digunakan
              </p>
              <h2 className="mt-5 font-semibold">Item paling laris</h2>
              <ol className="mt-2 space-y-1 text-sm">
                {r.top_items.length === 0 && <li className="text-stone-500">Belum ada pesanan.</li>}
                {r.top_items.map((i, n) => (
                  <li key={i.name} className="flex justify-between">
                    <span>{n + 1}. {i.name}</span>
                    <span className="tabular-nums text-stone-600">{i.qty}</span>
                  </li>
                ))}
              </ol>
            </section>
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="font-semibold">Waktu paling sibuk</h2>
              <p className="text-sm text-stone-600">{b?.day ? `${b.day}, ${b.hour}` : "Belum ada pesanan."}</p>
              <div className="mt-3 flex h-28 items-end gap-1" aria-label="Pesanan ikut jam">
                {Array.from({ length: 24 }, (_, h) => {
                  const n = r.by_hour.find((x) => x.hour === h)?.orders ?? 0;
                  return (
                    <div key={h} className="flex flex-1 flex-col items-center gap-1" title={`${h}:00 · ${n} pesanan`}>
                      <div className="w-full rounded-t bg-emerald-500" style={{ height: `${(n / maxHour) * 96}px`, minHeight: n ? 3 : 0 }} />
                      <span className="h-3 text-[9px] leading-3 text-stone-400">{h % 3 === 0 ? h : ""}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Hantar ke WhatsApp</h2>
            <pre className="mt-2 rounded-lg bg-stone-50 p-3 text-sm whitespace-pre-wrap">{text}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={wa} target="_blank" rel="noreferrer" className="btn-primary">
                {phone ? "Hantar ke WhatsApp saya" : "Kongsi melalui WhatsApp"}
              </a>
              <CopyButton text={text} />
            </div>
            {!phone && <p className="mt-2 text-xs text-stone-500">Isi nombor telefon kedai di Tetapan kedai supaya laporan terus ke WhatsApp anda.</p>}
          </section>
        </>
      )}
    </div>
  );
}
