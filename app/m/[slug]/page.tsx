import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MenuView from "@/components/MenuView";
import { getOutletMenu } from "@/lib/menu";
import { createPublicClient } from "@/lib/supabase/public";

// Menu umum outlet tanpa meja (cth. QR di pintu, media sosial). Tiada pesanan kerana meja tidak diketahui.
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getOutletMenu(createPublicClient(), slug).catch(() => null);
  return { title: menu ? `Menu · ${menu.outlet.name}` : "Menu" };
}

export default async function OutletMenuPage({ params }: Params) {
  const { slug } = await params;
  const menu = await getOutletMenu(createPublicClient(), slug).catch(() => null);
  if (!menu) notFound();
  return <MenuView settings={menu.outlet} categories={menu.categories} items={menu.items} />;
}
