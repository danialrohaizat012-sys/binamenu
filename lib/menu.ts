import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, DiningTable, MenuItem, Outlet, Plan } from "@/lib/types";

async function outletMenu(supabase: SupabaseClient, outlet: Outlet) {
  const [categories, items] = await Promise.all([
    supabase.from("categories").select("*").eq("outlet_id", outlet.id).order("sort_order").order("name"),
    supabase.from("menu_items").select("*").eq("outlet_id", outlet.id).order("sort_order").order("name"),
  ]);
  if (categories.error || items.error) return null;
  return {
    outlet,
    categories: categories.data as Category[],
    items: (items.data as MenuItem[]).map((i) => ({ ...i, options: i.options ?? [] })),
  };
}

// Menu sesebuah meja, dari kod pada tag NFC/QR
export async function getTableMenu(supabase: SupabaseClient, code: string) {
  const { data: table } = await supabase
    .from("dining_tables")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();
  if (!table) return null;
  const { data: outlet } = await supabase.from("outlets").select("*").eq("id", table.outlet_id).eq("is_active", true).maybeSingle();
  if (!outlet) return null;
  const menu = await outletMenu(supabase, outlet as Outlet);
  return menu && { ...menu, table: table as DiningTable };
}

// Menu umum outlet tanpa meja (cth. QR di pintu masuk)
export async function getOutletMenu(supabase: SupabaseClient, slug: string) {
  const { data: outlet } = await supabase.from("outlets").select("*").eq("slug", slug.toLowerCase()).eq("is_active", true).maybeSingle();
  if (!outlet) return null;
  return outletMenu(supabase, outlet as Outlet);
}

export const canOrder = (plan: Plan) => plan === "smart";
