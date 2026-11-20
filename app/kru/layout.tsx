import type { Metadata } from "next";
import Link from "next/link";
import NotRegistered from "@/components/NotRegistered";
import OutletSwitcher from "@/components/OutletSwitcher";
import { requireStaff } from "@/lib/staff";
import { signOut, switchOutletCrew } from "../admin/actions";

export const metadata: Metadata = { title: "Kru · Bina Menu" };

export default async function CrewLayout({ children }: { children: React.ReactNode }) {
  const { user, outlets, outlet } = await requireStaff();

  return (
    <div className="min-h-dvh bg-stone-100">
      <header className="bg-[#0f2347] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
          {outlet ? <OutletSwitcher outlets={outlets} current={outlet.id} action={switchOutletCrew} dark /> : <span className="font-bold">Bina Menu</span>}
          <nav className="flex gap-4 text-sm">
            <Link href="/kru" className="hover:underline">Pesanan</Link>
            <Link href="/kru/pesan" className="hover:underline">Ambil order</Link>
            {outlet?.role === "owner" && <Link href="/admin" className="hover:underline">Admin</Link>}
          </nav>
          <form action={signOut} className="ml-auto">
            <button className="text-sm text-white/70 hover:text-white">Log keluar</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        {!outlet ? (
          <NotRegistered email={user.email ?? ""} />
        ) : outlet.plan !== "smart" ? (
          <p className="rounded-xl bg-white p-6 text-stone-600">Skrin kru dan pesanan dari meja tersedia dalam pelan Smart.</p>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
