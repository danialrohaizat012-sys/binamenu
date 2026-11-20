import Link from "next/link";
import QRCode from "qrcode";
import Notice from "@/components/Notice";
import { getSiteUrl, tableUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { DiningTable } from "@/lib/types";
import { addTables, updateTable } from "../../actions";

export default async function TablesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("dining_tables").select("*").order("sort_order").order("label");
  const tables = (data ?? []) as DiningTable[];
  const base = await getSiteUrl();
  const qrs = await Promise.all(tables.map((t) => QRCode.toString(tableUrl(base, t.code), { type: "svg", margin: 1 })));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Meja &amp; NFC</h1>
      <p className="mb-4 text-sm text-stone-600">
        Setiap meja ada pautan sendiri. Tulis pautan ke tag NFC (app <b>NFC Tools</b>: Write → Add a record → URL), dan cetak QR yang
        sama pada sticker. Pautan kekal walaupun pelan dinaik taraf.
      </p>
      <Notice error={error} />

      <div className="mb-6 flex flex-wrap items-end gap-2 print:hidden">
        <form action={addTables} className="flex items-end gap-2">
          <label className="text-sm font-medium">
            Tambah meja
            <input name="count" type="number" min={1} max={50} defaultValue={tables.length ? 1 : 10} className="input mt-1 w-24" />
          </label>
          <button className="btn-primary">Tambah</button>
        </form>
        {tables.length > 0 && (
          <Link href="/admin/nfc/print" className="btn-secondary">
            Cetak semua sticker
          </Link>
        )}
      </div>

      {tables.length === 0 && <p className="rounded-xl bg-white p-6 text-stone-600">Belum ada meja. Tambah bilangan meja kedai anda di atas.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t, i) => (
          <div key={t.id} className={`rounded-xl bg-white p-4 shadow-sm ${t.is_active ? "" : "opacity-60"}`}>
            <div className="flex gap-3">
              <div className="w-24 shrink-0" dangerouslySetInnerHTML={{ __html: qrs[i] }} />
              <div className="min-w-0">
                <p className="text-xs text-stone-500">Kod {t.code}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-stone-600 select-all">{tableUrl(base, t.code)}</p>
                <a href={`/admin/nfc/sticker?kod=${t.code}`} download className="mt-2 inline-block text-xs font-medium text-orange-600 underline">
                  Muat turun sticker
                </a>
              </div>
            </div>
            <form action={updateTable} className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
              <input type="hidden" name="id" value={t.id} />
              <label className="text-sm">
                Meja
                <input name="label" defaultValue={t.label} required maxLength={12} className="input ml-2 inline-block w-20" />
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="is_active" defaultChecked={t.is_active} /> Aktif
              </label>
              <button className="btn-secondary ml-auto px-3 py-1.5 text-sm">Simpan</button>
            </form>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-stone-500">
        Meja yang tidak aktif tidak menerima pesanan, dan pautannya tunjuk &quot;Meja tidak dijumpai&quot;. Tag NFC tidak perlu ditulis semula jika
        label meja ditukar.
      </p>
    </div>
  );
}
