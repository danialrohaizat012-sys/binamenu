"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseOptions } from "@/lib/options";
import { getTemplate } from "@/lib/templates";
import type { OptionGroup } from "@/lib/types";

const BUCKET = "menu-images";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function back(path: string, error?: string): never {
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);
}

// Kemas kini halaman menu awam selepas setiap perubahan
function refreshMenu() {
  revalidatePath("/");
  revalidatePath("/t/[code]", "page");
  revalidatePath("/admin", "layout");
}

async function uploadImage(supabase: Awaited<ReturnType<typeof createClient>>, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("Fail mesti gambar.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Gagal muat naik gambar: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function removeImage(supabase: Awaited<ReturnType<typeof createClient>>, url: string | null) {
  const marker = `/${BUCKET}/`;
  if (!url?.includes(marker)) return;
  await supabase.storage.from(BUCKET).remove([url.split(marker)[1]]);
}

// ---------------- Auth ----------------

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) back("/admin/login", "Emel atau kata laluan salah.");
  const { data: staff } = await supabase.from("admins").select("role").eq("user_id", auth.user!.id).maybeSingle();
  redirect(staff?.role === "kru" ? "/kru" : "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------- Menu items ----------------

export async function saveItem(formData: FormData) {
  const supabase = await createClient();
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
    const uploaded = await uploadImage(supabase, formData.get("image"));
    if (uploaded || formData.get("remove_image") === "on") {
      await removeImage(supabase, image_url);
      image_url = uploaded;
    }
  } catch (e) {
    back(formPath, (e as Error).message);
  }

  const row = {
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
    ? await supabase.from("menu_items").update(row).eq("id", id)
    : await supabase.from("menu_items").insert(row);
  if (error) back(formPath, error.message);

  refreshMenu();
  redirect("/admin");
}

export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const { data } = await supabase.from("menu_items").select("image_url").eq("id", id).single();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) back(`/admin/items/${id}`, error.message);
  await removeImage(supabase, data?.image_url ?? null);
  refreshMenu();
  redirect("/admin");
}

export async function toggleAvailable(formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("menu_items")
    .update({ is_available: formData.get("is_available") === "true" })
    .eq("id", String(formData.get("id")));
  refreshMenu();
}

// ---------------- Categories ----------------

export async function saveCategory(formData: FormData) {
  const supabase = await createClient();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) back("/admin/categories", "Nama kategori diperlukan.");
  const row = { name, sort_order: Number(formData.get("sort_order") || 0) };
  const { error } = id
    ? await supabase.from("categories").update(row).eq("id", id)
    : await supabase.from("categories").insert(row);
  if (error) back("/admin/categories", error.message);
  refreshMenu();
  back("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", String(formData.get("id")));
  if (error) back("/admin/categories", error.message);
  refreshMenu();
  back("/admin/categories");
}

// ---------------- Settings ----------------

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  let logo_url = text(formData, "current_logo_url");
  try {
    const uploaded = await uploadImage(supabase, formData.get("logo"));
    if (uploaded || formData.get("remove_logo") === "on") {
      await removeImage(supabase, logo_url);
      logo_url = uploaded;
    }
  } catch (e) {
    back("/admin/settings", (e as Error).message);
  }

  const { error } = await supabase
    .from("settings")
    .update({
      name: text(formData, "name") ?? "Kedai Saya",
      tagline: text(formData, "tagline"),
      phone: text(formData, "phone"),
      address: text(formData, "address"),
      opening_hours: text(formData, "opening_hours"),
      theme_color: text(formData, "theme_color") ?? "#ea580c",
      template: getTemplate(text(formData, "template")).id,
      logo_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) back("/admin/settings", error.message);
  refreshMenu();
  redirect("/admin/settings?saved=1");
}

// ---------------- Meja (pautan NFC/QR) ----------------

export async function addTables(formData: FormData) {
  const supabase = await createClient();
  const count = Math.min(Math.max(Number(formData.get("count")) || 0, 1), 50);
  const { data: existing } = await supabase.from("dining_tables").select("label, sort_order");
  const numbers = (existing ?? []).map((t) => Number(t.label)).filter((n) => Number.isInteger(n));
  const start = (numbers.length ? Math.max(...numbers) : 0) + 1;
  const order = Math.max(0, ...(existing ?? []).map((t) => t.sort_order ?? 0)) + 1;
  const rows = Array.from({ length: count }, (_, i) => ({ label: String(start + i), sort_order: order + i }));
  const { error } = await supabase.from("dining_tables").insert(rows);
  if (error) back("/admin/nfc", error.message);
  revalidatePath("/admin/nfc");
  back("/admin/nfc");
}

export async function updateTable(formData: FormData) {
  const supabase = await createClient();
  const label = text(formData, "label");
  if (!label) back("/admin/nfc", "Label meja diperlukan.");
  const { error } = await supabase
    .from("dining_tables")
    .update({ label, is_active: formData.get("is_active") === "on" })
    .eq("id", String(formData.get("id")));
  if (error) back("/admin/nfc", error.message);
  refreshMenu();
  back("/admin/nfc");
}
