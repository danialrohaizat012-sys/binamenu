import CrewBoard from "@/components/kru/CrewBoard";
import { requireStaff } from "@/lib/staff";
import { startOfTodayMyt } from "@/lib/time";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const { supabase, role } = await requireStaff();
  if (!role) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .gte("created_at", startOfTodayMyt().toISOString())
    .order("created_at");
  return <CrewBoard initial={(data ?? []) as Order[]} loadError={error?.message ?? null} />;
}
