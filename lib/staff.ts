import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Pengguna log masuk dan peranannya (owner/kru). Tiada sesi: ke halaman log masuk.
export async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return { supabase, user, role: (data?.role as "owner" | "kru" | undefined) ?? null };
}
