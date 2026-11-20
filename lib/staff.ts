import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

export const OUTLET_COOKIE = "bm_outlet";

export type MyOutlet = { id: string; slug: string; name: string; plan: Plan; role: "owner" | "kru" };

// Pengguna log masuk, outlet yang boleh diakses, dan outlet yang sedang dipilih
export async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.rpc("my_outlets");
  const outlets = (data ?? []) as MyOutlet[];
  const chosen = (await cookies()).get(OUTLET_COOKIE)?.value;
  const outlet = outlets.find((o) => o.id === chosen) ?? outlets[0] ?? null;
  return { supabase, user, outlets, outlet };
}

// Halaman admin: owner sahaja. Kru dibawa ke skrin kru.
export async function requireOwner() {
  const ctx = await requireStaff();
  if (ctx.outlet && ctx.outlet.role !== "owner") redirect("/kru");
  if (!ctx.outlet) throw new Error("Tiada outlet untuk akaun ini.");
  return { ...ctx, outlet: ctx.outlet };
}
