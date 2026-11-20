import Link from "next/link";
import { redirect } from "next/navigation";
import NotRegistered from "@/components/NotRegistered";
import { requireStaff } from "@/lib/staff";
import { signOut } from "../actions";

const links = [
  { href: "/admin", label: "Menu" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/nfc", label: "Meja & NFC" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/settings", label: "Tetapan kedai" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireStaff();
  // Kru hanya guna skrin kru dan mod pelayan
  if (role === "kru") redirect("/kru");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-stone-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <span className="font-bold">Admin Menu</span>
          <nav className="flex flex-wrap gap-4 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-stone-600 hover:text-orange-600">
                {l.label}
              </Link>
            ))}
            <a href="/kru" target="_blank" className="text-stone-600 hover:text-orange-600">
              Skrin kru ↗
            </a>
          </nav>
          <form action={signOut} className="ml-auto">
            <button className="text-sm text-stone-500 hover:text-stone-900">Log keluar</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">
        {role ? children : <NotRegistered userId={user.id} />}
      </main>
    </div>
  );
}
