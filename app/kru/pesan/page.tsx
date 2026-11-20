import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import type { DiningTable } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WaiterTablesPage() {
  const { supabase, outlet } = await requireStaff();
  if (!outlet || outlet.plan !== "smart") return null;
  const { data: tables } = await supabase
    .from("dining_tables")
    .select("*")
    .eq("outlet_id", outlet.id)
    .eq("is_active", true)
    .order("sort_order")
    .order("label");

  const list = (tables ?? []) as DiningTable[];
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Ambil order</h1>
      <p className="mb-5 text-sm text-stone-600">Pilih meja. Order masuk ke skrin kru sebagai &quot;Pelayan&quot;. Kedai yang sudah guna POS boleh terus guna POS untuk order di kaunter.</p>
      {list.length === 0 && <p className="rounded-xl bg-white p-6 text-stone-600">Belum ada meja. Owner boleh tambah meja di Admin → Meja &amp; NFC.</p>}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
        {list.map((t) => (
          <Link
            key={t.id}
            href={`/kru/pesan/${t.code}`}
            className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-white text-center shadow-sm ring-1 ring-stone-200 hover:ring-2 hover:ring-emerald-500"
          >
            <span className="text-xs text-stone-500">Meja</span>
            <span className="text-3xl font-extrabold text-[#0f2347]">{t.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
