import { notFound } from "next/navigation";
import MenuView from "@/components/MenuView";
import { canOrder, getTableMenu } from "@/lib/menu";
import { requireStaff } from "@/lib/staff";
import { placeWaiterOrder } from "../../actions";

export const dynamic = "force-dynamic";

export default async function WaiterOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { supabase, role } = await requireStaff();
  if (!role) return null;
  const menu = await getTableMenu(supabase, code);
  if (!menu) notFound();
  if (!canOrder(menu.plan)) return <p className="rounded-xl bg-white p-6 text-stone-600">Mod pelayan tersedia untuk pelan Smart dan Pro.</p>;

  return (
    <div className="-mx-4 -my-5">
      <MenuView
        settings={menu.settings}
        categories={menu.categories}
        items={menu.items}
        table={{ label: menu.table.label, code: menu.table.code }}
        ordering={{ mode: "pelayan", submit: placeWaiterOrder, doneHref: "/kru/pesan" }}
      />
    </div>
  );
}
