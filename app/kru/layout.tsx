import type { Metadata } from "next";
import Link from "next/link";
import NotRegistered from "@/components/NotRegistered";
import { requireStaff } from "@/lib/staff";
import { signOut } from "../admin/actions";

export const metadata: Metadata = { title: "Kru · Bina Menu" };

export default async function CrewLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, role } = await requireStaff();
  const { data: settings } = await supabase.from("settings").select("name").eq("id", 1).maybeSingle();

  return (
    <div className="min-h-dvh bg-stone-100">
      <header className="bg-[#0f2347] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
          <span className="font-bold">{settings?.name ?? "Kedai"} · Kru</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/kru" className="hover:underline">Pesanan</Link>
            <Link href="/kru/pesan" className="hover:underline">Ambil order</Link>
            {role === "owner" && <Link href="/admin" className="hover:underline">Admin</Link>}
          </nav>
          <form action={signOut} className="ml-auto">
            <button className="text-sm text-white/70 hover:text-white">Log keluar</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{role ? children : <NotRegistered userId={user.id} />}</main>
    </div>
  );
}
