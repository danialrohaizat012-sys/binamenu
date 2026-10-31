import Link from "next/link";
import type { Category, MenuItem } from "@/lib/types";
import { deleteItem, saveItem } from "@/app/admin/actions";

export default function ItemForm({ item, categories }: { item?: MenuItem; categories: Category[] }) {
  return (
    <div className="space-y-4">
      <form action={saveItem} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        {item && <input type="hidden" name="id" value={item.id} />}
        <input type="hidden" name="current_image_url" value={item?.image_url ?? ""} />

        <label className="block text-sm font-medium">
          Nama
          <input name="name" required defaultValue={item?.name} className="input mt-1" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Kategori
            <select name="category_id" required defaultValue={item?.category_id} className="input mt-1">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Harga (RM)
            <input name="price" type="number" step="0.01" min="0" required defaultValue={item?.price} className="input mt-1" />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Penerangan
          <textarea name="description" rows={3} defaultValue={item?.description ?? ""} className="input mt-1" />
        </label>

        <div className="block text-sm font-medium">
          Gambar
          {item?.image_url && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <label className="flex items-center gap-2 font-normal">
                <input type="checkbox" name="remove_image" /> Buang gambar
              </label>
            </div>
          )}
          <input name="image" type="file" accept="image/*" className="mt-2 block w-full text-sm" />
          <p className="mt-1 text-xs font-normal text-stone-500">Maksimum 5MB. Gambar segi empat sama paling cantik.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_available" defaultChecked={item?.is_available ?? true} /> Ada dijual
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_popular" defaultChecked={item?.is_popular} /> Tanda popular ⭐
          </label>
          <label className="block text-sm font-medium">
            Susunan
            <input name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} className="input mt-1" />
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="btn-primary">Simpan</button>
          <Link href="/admin" className="btn-secondary">
            Batal
          </Link>
        </div>
      </form>

      {item && (
        <form action={deleteItem}>
          <input type="hidden" name="id" value={item.id} />
          <button className="btn-danger">Padam item ini</button>
        </form>
      )}
    </div>
  );
}
