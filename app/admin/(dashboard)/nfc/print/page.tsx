import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { requireOwner } from "@/lib/staff";
import { getSiteUrl, tableUrl } from "@/lib/site";
import { STICKER_H, STICKER_W, stickerSvg } from "@/lib/sticker";
import type { DiningTable, Settings } from "@/lib/types";

// Helaian A4 untuk cetak sendiri: sticker saiz kad bank sebenar dengan garis potong (10 sehelai)
export default async function PrintStickersPage() {
  const { supabase, outlet } = await requireOwner();
  const [{ data }, { data: tables }] = await Promise.all([
    supabase.from("outlets").select("*").eq("id", outlet.id).single(),
    supabase.from("dining_tables").select("*").eq("outlet_id", outlet.id).eq("is_active", true).order("sort_order").order("label"),
  ]);
  const s = data as Settings;
  const base = await getSiteUrl();

  const stickers = ((tables ?? []) as DiningTable[]).map((t) =>
    stickerSvg({ name: s.name, url: tableUrl(base, t.code), table: t.label, bleed: false }),
  );

  return (
    <div>
      <style>{`@page { size: A4; margin: 10mm; }`}</style>
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="text-2xl font-bold">Cetak sticker</h1>
        <PrintButton />
        <Link href="/admin/nfc" className="btn-secondary">
          Kembali
        </Link>
        <p className="w-full text-sm text-stone-500">
          Setiap sticker bersaiz {STICKER_W} × {STICKER_H}mm (saiz kad bank). Masa cetak, pilih skala <b>100%</b> / <b>Actual size</b>, bukan
          &quot;Fit to page&quot;. Potong ikut garis putus-putus.
        </p>
      </div>
      {stickers.length === 0 && <p className="rounded-xl bg-white p-6 text-stone-600">Tiada meja aktif.</p>}
      <div className="grid grid-cols-[repeat(2,max-content)] gap-[3mm]">
        {stickers.map((svg, i) => (
          <div key={i} className="break-inside-avoid" dangerouslySetInnerHTML={{ __html: svg }} />
        ))}
      </div>
    </div>
  );
}
