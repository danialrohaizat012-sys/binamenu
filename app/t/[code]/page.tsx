import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MenuView from "@/components/MenuView";
import { canOrder, getTableMenu } from "@/lib/menu";
import { createPublicClient } from "@/lib/supabase/public";
import { customerOrderStatus, placeCustomerOrder } from "../actions";

// Menu meja dibina semula paling lama setiap 60 saat, dan serta-merta bila admin simpan.
export const revalidate = 60;

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const menu = await getTableMenu(createPublicClient(), code).catch(() => null);
  return { title: menu ? `Menu · ${menu.settings.name}` : "Menu" };
}

export default async function TableMenuPage({ params }: Params) {
  const { code } = await params;
  const menu = await getTableMenu(createPublicClient(), code).catch(() => null);
  if (!menu) notFound();

  return (
    <MenuView
      settings={menu.settings}
      categories={menu.categories}
      items={menu.items}
      table={{ label: menu.table.label, code: menu.table.code }}
      ordering={canOrder(menu.plan) ? { mode: "pelanggan", submit: placeCustomerOrder, status: customerOrderStatus } : undefined}
    />
  );
}
