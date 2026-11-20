import CrewBoard from "@/components/kru/CrewBoard";
import { requireStaff } from "@/lib/staff";
import { startOfTodayMyt } from "@/lib/time";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const { supabase, outlet } = await requireStaff();
  if (!outlet || outlet.plan !== "smart") return null;
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("outlet_id", outlet.id)
    .gte("created_at", startOfTodayMyt().toISOString())
    .order("created_at");
  return <CrewBoard key={outlet.id} outletId={outlet.id} initial={(data ?? []) as Order[]} loadError={error?.message ?? null} />;
}
