import Link from "next/link";
import { redirect } from "next/navigation";
import NotRegistered from "@/components/NotRegistered";
import OutletSwitcher from "@/components/OutletSwitcher";
import { requireStaff } from "@/lib/staff";
import { signOut, switchOutlet } from "../actions";

const links = [
  { href: "/admin", label: "Menu" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/nfc", label: "Meja & NFC" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/settings", label: "Tetapan kedai" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, outlets, outlet } = await requireStaff();
  // Kru hanya guna skrin kru dan mod pelayan
  if (outlet && outlet.role !== "owner") redirect("/kru");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-stone-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          {outlet ? <OutletSwitcher outlets={outlets.filter((o) => o.role === "owner")} current={outlet.id} action={switchOutlet} /> : <span className="font-bold">Bina Menu</span>}
          <nav className="flex flex-wrap gap-4 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-stone-600 hover:text-orange-600">
                {l.label}
              </Link>
            ))}
            {outlet?.plan === "smart" && (
              <a href="/kru" target="_blank" className="text-stone-600 hover:text-orange-600">
                Skrin kru ↗
              </a>
            )}
          </nav>
          <form action={signOut} className="ml-auto">
            <button className="text-sm text-stone-500 hover:text-stone-900">Log keluar</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">
        {outlet ? children : <NotRegistered email={user.email ?? ""} />}
      </main>
    </div>
  );
}
