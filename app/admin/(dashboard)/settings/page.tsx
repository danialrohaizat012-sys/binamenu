import Notice from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATES } from "@/lib/templates";
import type { Settings } from "@/lib/types";
import { saveSettings } from "../../actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  const s = data as Settings;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tetapan kedai</h1>
      <Notice error={error} success={saved ? "Tetapan disimpan." : undefined} />
      <form action={saveSettings} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <input type="hidden" name="current_logo_url" value={s.logo_url ?? ""} />
        <label className="block text-sm font-medium">
          Nama kedai
          <input name="name" required defaultValue={s.name} className="input mt-1" />
        </label>
        <label className="block text-sm font-medium">
          Slogan / penerangan ringkas
          <input name="tagline" defaultValue={s.tagline ?? ""} className="input mt-1" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Waktu operasi
            <input name="opening_hours" defaultValue={s.opening_hours ?? ""} placeholder="Isnin - Sabtu, 8am - 10pm" className="input mt-1" />
          </label>
          <label className="block text-sm font-medium">
            No. telefon
            <input name="phone" defaultValue={s.phone ?? ""} className="input mt-1" />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Alamat
          <input name="address" defaultValue={s.address ?? ""} className="input mt-1" />
        </label>
        <fieldset>
          <legend className="text-sm font-medium">Template paparan menu</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer gap-3 rounded-xl border border-stone-200 p-3 has-[:checked]:border-orange-500 has-[:checked]:ring-2 has-[:checked]:ring-orange-200"
              >
                <input type="radio" name="template" value={t.id} defaultChecked={s.template === t.id} className="mt-1" />
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="h-3 w-3 rounded-full" style={{ background: t.defaultColor }} />
                    {t.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-500">{t.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium">
          Warna tema
          <input name="theme_color" type="color" defaultValue={s.theme_color} className="mt-1 block h-10 w-20 rounded" />
          <span className="mt-1 block text-xs font-normal text-stone-500">
            Digunakan untuk harga, butang dan kategori aktif. Cadangan: Klasik oren, Kafe coklat, Premium emas, Warung merah.
          </span>
        </label>
        <div className="text-sm font-medium">
          Logo
          {s.logo_url && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.logo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              <label className="flex items-center gap-2 font-normal">
                <input type="checkbox" name="remove_logo" /> Buang logo
              </label>
            </div>
          )}
          <input name="logo" type="file" accept="image/*" className="mt-2 block w-full text-sm" />
        </div>
        <button className="btn-primary">Simpan</button>
      </form>
    </div>
  );
}
