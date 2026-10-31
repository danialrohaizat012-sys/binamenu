import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

const links = [
  { href: "/admin", label: "Menu" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/settings", label: "Tetapan kedai" },
  { href: "/admin/nfc", label: "NFC & QR" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <span className="font-bold">Admin Menu</span>
          <nav className="flex flex-wrap gap-4 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-stone-600 hover:text-orange-600">
                {l.label}
              </Link>
            ))}
            <a href="/" target="_blank" className="text-stone-600 hover:text-orange-600">
              Lihat menu ↗
            </a>
          </nav>
          <form action={signOut} className="ml-auto">
            <button className="text-sm text-stone-500 hover:text-stone-900">Log keluar</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        {admin ? (
          children
        ) : (
          <div className="rounded-xl bg-amber-50 p-5 text-amber-900">
            <p className="font-semibold">Akaun ini belum didaftarkan sebagai admin.</p>
            <p className="mt-2 text-sm">
              Jalankan SQL ini dalam Supabase SQL Editor:
              <code className="mt-2 block rounded bg-white p-2 text-xs">
                insert into public.admins (user_id) values (&apos;{user.id}&apos;);
              </code>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
