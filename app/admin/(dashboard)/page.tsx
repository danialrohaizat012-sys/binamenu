import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Category, MenuItem } from "@/lib/types";
import { toggleAvailable } from "../actions";

export default async function AdminMenuPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("menu_items").select("*").order("sort_order").order("name"),
  ]);
  const cats = (categories ?? []) as Category[];
  const all = (items ?? []) as MenuItem[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Menu</h1>
        {cats.length > 0 && (
          <Link href="/admin/items/new" className="btn-primary">
            + Tambah item
          </Link>
        )}
      </div>

      {cats.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-stone-600">
          Mula dengan <Link href="/admin/categories" className="text-orange-600 underline">tambah kategori</Link> (cth. Makanan, Minuman).
        </p>
      )}

      <div className="space-y-6">
        {cats.map((cat) => {
          const catItems = all.filter((i) => i.category_id === cat.id);
          return (
            <section key={cat.id} className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-semibold">
                {cat.name} <span className="text-sm font-normal text-stone-400">({catItems.length})</span>
              </h2>
              {catItems.length === 0 && <p className="py-2 text-sm text-stone-400">Tiada item.</p>}
              <ul className="divide-y divide-stone-100">
                {catItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-stone-100" />
                    )}
                    <Link href={`/admin/items/${item.id}`} className="min-w-0 flex-1 hover:text-orange-600">
                      <p className="truncate font-medium">
                        {item.name} {item.is_popular && "⭐"}
                      </p>
                      <p className="text-sm text-stone-500">{formatPrice(item.price)}</p>
                    </Link>
                    <form action={toggleAvailable}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="is_available" value={String(!item.is_available)} />
                      <button
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.is_available ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-600"
                        }`}
                        title="Klik untuk tukar"
                      >
                        {item.is_available ? "Ada" : "Habis"}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
