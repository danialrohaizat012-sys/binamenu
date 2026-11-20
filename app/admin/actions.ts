"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseOptions } from "@/lib/options";
import { OUTLET_COOKIE, requireOwner, requireStaff } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import type { OptionGroup } from "@/lib/types";

const BUCKET = "menu-images";

type Db = Awaited<ReturnType<typeof createClient>>;

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function back(path: string, error?: string): never {
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);
}

// Kemas kini halaman menu awam selepas setiap perubahan
function refreshMenu() {
  revalidatePath("/t/[code]", "page");
  revalidatePath("/m/[slug]", "page");
  revalidatePath("/admin", "layout");
}

// Gambar disimpan dalam folder outlet: {outlet_id}/{uuid}.jpg (polisi storage semak folder ini)
async function uploadImage(supabase: Db, outletId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("Fail mesti gambar.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${outletId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Gagal muat naik gambar: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function removeImage(supabase: Db, url: string | null) {
  const marker = `/${BUCKET}/`;
  if (!url?.includes(marker)) return;
  await supabase.storage.from(BUCKET).remove([url.split(marker)[1]]);
}

// ---------------- Auth & outlet ----------------

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) back("/admin/login", "Emel atau kata laluan salah.");
  const { data } = await supabase.rpc("my_outlets");
  const outlets = (data ?? []) as { id: string; role: string }[];
  if (outlets[0]) (await cookies()).set(OUTLET_COOKIE, outlets[0].id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect(outlets.some((o) => o.role === "owner") ? "/admin" : "/kru");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(OUTLET_COOKIE);
  redirect("/admin/login");
}

export async function switchOutlet(formData: FormData) {
  const { outlets } = await requireStaff();
  const target = outlets.find((o) => o.id === String(formData.get("outlet")));
  if (!target) back("/admin");
  (await cookies()).set(OUTLET_COOKIE, target.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect(target.role === "owner" ? "/admin" : "/kru");
}

export async function switchOutletCrew(formData: FormData) {
  const { outlets } = await requireStaff();
  const target = outlets.find((o) => o.id === String(formData.get("outlet")));
  if (target) (await cookies()).set(OUTLET_COOKIE, target.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect("/kru");
}

// ---------------- Menu items ----------------

export async function saveItem(formData: FormData) {
  const { supabase, outlet } = await requireOwner();
  const id = text(formData, "id");
  const formPath = id ? `/admin/items/${id}` : "/admin/items/new";

  const price = Number(formData.get("price"));
  const name = text(formData, "name");
  const category_id = text(formData, "category_id");
  if (!name || !category_id || !Number.isFinite(price) || price < 0) {
    back(formPath, "Sila isi nama, kategori dan harga yang sah.");
  }

  let options: OptionGroup[] = [];
  try {
    options = parseOptions(String(formData.get("options") ?? "[]"));
  } catch (e) {
    back(formPath, (e as Error).message);
  }

  let image_url = text(formData, "current_image_url");
  try {
    const uploaded = await uploadImage(supabase, outlet.id, formData.get("image"));
    if (uploaded || formData.get("remove_image") === "on") {
      await removeImage(supabase, image_url);
      image_url = uploaded;
    }
  } catch (e) {
    back(formPath, (e as Error).message);
  }

  const row = {
    outlet_id: outlet.id,
    name,
    category_id,
    price,
    image_url,
    options,
    description: text(formData, "description"),
    sort_order: Number(formData.get("sort_order") || 0),
    is_available: formData.get("is_available") === "on",
    is_popular: formData.get("is_popular") === "on",
  };

  const { error } = id
    ? await supabase.from("menu_items").update(row).eq("id", id).eq("outlet_id", outlet.id)
    : await supabase.from("menu_items").insert(row);
  if (error) back(formPath, error.message);

  refreshMenu();
  redirect("/admin");
}

export async function deleteItem(formData: FormData) {
  const { supabase, outlet } = await requireOwner();
  const id = String(formData.get("id"));
  const { data } = await supabase.from("menu_items").select("image_url").eq("id", id).eq("outlet_id", outlet.id).single();
  const { error } = await supabase.from("menu_items").delete().eq("id", id).eq("outlet_id", outlet.id);
  if (error) back(`/admin/items/${id}`, error.message);
  await removeImage(supabase, data?.image_url ?? null);
  refreshMenu();
  redirect("/admin");
}

export async function toggleAvailable(formData: FormData) {
  const { supabase, outlet } = await requireOwner();
  await supabase
    .from("menu_items")
    .update({ is_available: formData.get("is_available") === "true" })
    .eq("id", String(formData.get("id")))
    .eq("outlet_id", outlet.id);
  refreshMenu();
}

// ---------------- Categories ----------------

export async function saveCategory(formData: FormData) {
  const { supabase, outlet } = await requireOwner();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) back("/admin/categories", "Nama kategori diperlukan.");
  const row = { outlet_id: outlet.id, name, sort_order: Number(formData.get("sort_order") || 0) };
  const { error } = id
    ? await supabase.from("categories").update(row).eq("id", id).eq("outlet_id", outlet.id)
    : await supabase.from("categories").insert(row);
  if (error) back("/admin/categories", error.message);
  refreshMenu();
  back("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const { supabase, outlet } = await requireOwner();
  const { error } = await supabase.from("categories").delete().eq("id", String(formData.get("id"))).eq("outlet_id", outlet.id);
  if (error) back("/admin/categories", error.message);
  refreshMenu();
  back("/admin/categories");
}

// ---------------- Tetapan kedai ----------------

export async function saveSettings(formData: FormData) {
  const { supabase, outlet } = await requireOwner();
  let logo_url = text(formData, "current_logo_url");
  try {
    const uploaded = await uploadImage(supabase, outlet.id, formData.get("logo"));
    if (uploaded || formData.get("remove_logo") === "on") {
      await removeImage(supabase, logo_url);
      logo_url = uploaded;
    }
  } catch (e) {
    back("/admin/settings", (e as Error).message);
  }

  const { error } = await supabase
    .from("outlets")
    .update({
      name: text(formData, "name") ?? outlet.name,
      tagline: text(formData, "tagline"),
      phone: text(formData, "phone"),
      address: text(formData, "address"),
      opening_hours: text(formData, "opening_hours"),
      theme_color: text(formData, "theme_color") ?? "#ea580c",
      template: getTemplate(text(formData, "template")).id,
      logo_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outlet.id);
  if (error) back("/admin/settings", error.message);
  refreshMenu();
  redirect("/admin/settings?saved=1");
}

// ---------------- Meja (pautan NFC/QR) ----------------

export async function addTables(formData: FormData) {
  const { supabase, outlet } = await requireOwner();
  const count = Math.min(Math.max(Number(formData.get("count")) || 0, 1), 50);
  const { data: existing } = await supabase.from("dining_tables").select("label, sort_order").eq("outlet_id", outlet.id);
  const numbers = (existing ?? []).map((t) => Number(t.label)).filter((n) => Number.isInteger(n));
  const start = (numbers.length ? Math.max(...numbers) : 0) + 1;
  const order = Math.max(0, ...(existing ?? []).map((t) => t.sort_order ?? 0)) + 1;
  const rows = Array.from({ length: count }, (_, i) => ({ outlet_id: outlet.id, label: String(start + i), sort_order: order + i }));
  const { error } = await supabase.from("dining_tables").insert(rows);
  if (error) back("/admin/nfc", error.message);
  revalidatePath("/admin/nfc");
  back("/admin/nfc");
}

export async function updateTable(formData: FormData) {
  const { supabase, outlet } = await requireOwner();
  const label = text(formData, "label");
  if (!label) back("/admin/nfc", "Label meja diperlukan.");
  const { error } = await supabase
    .from("dining_tables")
    .update({ label, is_active: formData.get("is_active") === "on" })
    .eq("id", String(formData.get("id")))
    .eq("outlet_id", outlet.id);
  if (error) back("/admin/nfc", error.message);
  refreshMenu();
  back("/admin/nfc");
}
