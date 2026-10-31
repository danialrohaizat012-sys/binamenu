import Notice from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { deleteCategory, saveCategory } from "../../actions";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
  const categories = (data ?? []) as Category[];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Kategori</h1>
      <Notice error={error} />

      <form action={saveCategory} className="mb-6 flex flex-wrap items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
        <label className="min-w-48 flex-1 text-sm font-medium">
          Kategori baru
          <input name="name" required placeholder="cth. Minuman Sejuk" className="input mt-1" />
        </label>
        <label className="w-24 text-sm font-medium">
          Susunan
          <input name="sort_order" type="number" defaultValue={categories.length + 1} className="input mt-1" />
        </label>
        <button className="btn-primary">Tambah</button>
      </form>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat.id} className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 shadow-sm">
            <form action={saveCategory} className="flex flex-1 flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={cat.id} />
              <input name="name" required defaultValue={cat.name} className="input min-w-40 flex-1" />
              <input name="sort_order" type="number" defaultValue={cat.sort_order} className="input w-20" aria-label="Susunan" />
              <button className="btn-secondary">Simpan</button>
            </form>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={cat.id} />
              <button className="btn-danger" title="Semua item dalam kategori ini juga akan dipadam">
                Padam
              </button>
            </form>
          </li>
        ))}
      </ul>
      {categories.length > 0 && (
        <p className="mt-3 text-xs text-stone-500">Nombor susunan kecil dipaparkan dahulu. Padam kategori akan memadam semua item di dalamnya.</p>
      )}
    </div>
  );
}
