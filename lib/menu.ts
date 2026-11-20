import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, DiningTable, MenuItem, Plan, Settings } from "@/lib/types";

// Data yang diperlukan untuk paparkan menu sesebuah meja
export async function getTableMenu(supabase: SupabaseClient, code: string) {
  const [table, settings, sub, categories, items] = await Promise.all([
    supabase.from("dining_tables").select("*").eq("code", code.toUpperCase()).eq("is_active", true).maybeSingle(),
    supabase.from("settings").select("*").eq("id", 1).single(),
    supabase.from("subscription").select("plan").eq("id", 1).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("menu_items").select("*").order("sort_order").order("name"),
  ]);
  if (!table.data || settings.error || categories.error || items.error) return null;
  return {
    table: table.data as DiningTable,
    settings: settings.data as Settings,
    plan: ((sub.data?.plan as Plan | undefined) ?? "lite") as Plan,
    categories: categories.data as Category[],
    items: (items.data as MenuItem[]).map((i) => ({ ...i, options: i.options ?? [] })),
  };
}

export const canOrder = (plan: Plan) => plan === "smart" || plan === "pro";
