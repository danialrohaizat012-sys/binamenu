import type { Metadata } from "next";
import MenuView from "@/components/MenuView";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, MenuItem, Settings } from "@/lib/types";

// Halaman menu dibina semula paling lama setiap 60 saat,
// dan serta-merta bila admin simpan perubahan.
export const revalidate = 60;

async function getMenu() {
  const supabase = createPublicClient();
  const [settings, categories, items] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).single(),
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("menu_items").select("*").order("sort_order").order("name"),
  ]);
  if (settings.error || categories.error || items.error) return null;
  return {
    settings: settings.data as Settings,
    categories: categories.data as Category[],
    items: items.data as MenuItem[],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const menu = await getMenu().catch(() => null);
  if (!menu) return { title: "Menu" };
  return {
    title: `Menu · ${menu.settings.name}`,
    description: menu.settings.tagline ?? undefined,
  };
}

export default async function Home() {
  const menu = await getMenu().catch(() => null);

  if (!menu) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold">Menu belum tersedia</p>
          <p className="mt-1 text-sm text-stone-500">Sila cuba sebentar lagi.</p>
        </div>
      </main>
    );
  }

  return <MenuView {...menu} />;
}
