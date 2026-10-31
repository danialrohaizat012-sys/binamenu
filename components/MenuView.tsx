"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import TableBadge from "@/components/TableBadge";
import { formatPrice } from "@/lib/format";
import type { Category, MenuItem, Settings } from "@/lib/types";

type Props = {
  settings: Settings;
  categories: Category[];
  items: MenuItem[];
};

export default function MenuView({ settings, categories, items }: Props) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((category) => ({
        category,
        items: items.filter(
          (item) =>
            item.category_id === category.id &&
            (!q ||
              item.name.toLowerCase().includes(q) ||
              item.description?.toLowerCase().includes(q)),
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [categories, items, query]);

  // Tandakan kategori yang sedang dilihat semasa scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id.replace("cat-", ""));
      },
      { rootMargin: "-130px 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(`cat-${s.category.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  // Pastikan chip kategori aktif kelihatan dalam nav
  useEffect(() => {
    if (!activeId) return;
    navRef.current
      ?.querySelector(`[data-cat="${activeId}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const brand = settings.theme_color || "#ea580c";

  return (
    <div style={{ ["--brand" as string]: brand }} className="mx-auto min-h-dvh max-w-xl bg-white pb-16 shadow-sm">
      <header className="px-5 pt-8 pb-5 text-center" style={{ background: `linear-gradient(180deg, ${brand}1a, transparent)` }}>
        {settings.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logo_url} alt={settings.name} className="mx-auto mb-3 h-20 w-20 rounded-full object-cover ring-4 ring-white shadow" />
        )}
        <h1 className="text-2xl font-bold tracking-tight">{settings.name}</h1>
        {settings.tagline && <p className="mt-1 text-stone-600">{settings.tagline}</p>}
        {settings.opening_hours && <p className="mt-2 text-xs text-stone-500">🕒 {settings.opening_hours}</p>}
        <Suspense>
          <TableBadge color={brand} />
        </Suspense>
      </header>

      <div className="sticky top-0 z-10 border-b border-stone-100 bg-white/95 backdrop-blur">
        <div className="px-4 pt-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari menu…"
            className="w-full rounded-xl bg-stone-100 px-4 py-2.5 text-[16px] outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <nav ref={navRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
          {sections.map(({ category }) => {
            const active = activeId === category.id;
            return (
              <a
                key={category.id}
                href={`#cat-${category.id}`}
                data-cat={category.id}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={active ? { background: brand, color: "#fff" } : { background: "#f5f5f4", color: "#44403c" }}
              >
                {category.name}
              </a>
            );
          })}
        </nav>
      </div>

      <main className="px-4">
        {sections.length === 0 && (
          <p className="py-16 text-center text-stone-500">{query ? "Tiada menu dijumpai." : "Menu masih kosong."}</p>
        )}
        {sections.map(({ category, items }) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-32 pt-6">
            <h2 className="mb-3 text-lg font-bold">{category.name}</h2>
            <ul className="divide-y divide-stone-100">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setSelected(item)}
                    className={`flex w-full gap-3 py-3 text-left ${item.is_available ? "" : "opacity-50"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.is_popular && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">⭐ Popular</span>
                        )}
                        {!item.is_available && (
                          <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[11px] font-semibold text-stone-700">Habis</span>
                        )}
                      </div>
                      {item.description && <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{item.description}</p>}
                      <p className="mt-1.5 font-semibold" style={{ color: brand }}>{formatPrice(item.price)}</p>
                    </div>
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} loading="lazy" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <footer className="mt-10 px-5 text-center text-xs text-stone-400">
        {settings.address && <p>{settings.address}</p>}
        {settings.phone && (
          <p className="mt-1">
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="underline">{settings.phone}</a>
          </p>
        )}
        <p className="mt-3">Harga tertakluk kepada perubahan.</p>
      </footer>

      {selected && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl overflow-hidden rounded-t-3xl bg-white pb-8" onClick={(e) => e.stopPropagation()}>
            {selected.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.image_url} alt={selected.name} className="aspect-[4/3] w-full object-cover" />
            )}
            <div className="px-5 pt-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold">{selected.name}</h3>
                <p className="shrink-0 text-lg font-bold" style={{ color: brand }}>{formatPrice(selected.price)}</p>
              </div>
              {selected.description && <p className="mt-2 text-stone-600">{selected.description}</p>}
              {!selected.is_available && <p className="mt-3 font-medium text-stone-500">Maaf, item ini telah habis.</p>}
              <button onClick={() => setSelected(null)} className="mt-6 w-full rounded-xl bg-stone-100 py-3 font-semibold">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
