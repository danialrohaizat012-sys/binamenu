import { notFound } from "next/navigation";
import MenuView from "@/components/MenuView";
import { getTableMenu } from "@/lib/menu";
import { requireStaff } from "@/lib/staff";
import { placeWaiterOrder } from "../../actions";

export const dynamic = "force-dynamic";

export default async function WaiterOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { supabase, outlet } = await requireStaff();
  if (!outlet || outlet.plan !== "smart") return null;
  const menu = await getTableMenu(supabase, code);
  // Hanya meja outlet yang sedang dipilih
  if (!menu || menu.outlet.id !== outlet.id) notFound();

  return (
    <div className="-mx-4 -my-5">
      <MenuView
        settings={menu.outlet}
        categories={menu.categories}
        items={menu.items}
        table={{ label: menu.table.label, code: menu.table.code }}
        ordering={{ mode: "pelayan", submit: placeWaiterOrder, doneHref: "/kru/pesan" }}
      />
    </div>
  );
}
