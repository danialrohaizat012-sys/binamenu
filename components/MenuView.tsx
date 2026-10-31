"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import TableBadge from "@/components/TableBadge";
import { formatPrice } from "@/lib/format";
import { getTemplate } from "@/lib/templates";
import type { Category, MenuItem, Settings } from "@/lib/types";

type Props = {
  settings: Settings;
  categories: Category[];
  items: MenuItem[];
};

// Struktur sama untuk semua template; rupa setiap template ditentukan
// oleh app/menu-templates.css melalui atribut data-template.
export default function MenuView({ settings, categories, items }: Props) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const navRef = useRef<HTMLElement>(null);

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

  const currentId = activeId ?? sections[0]?.category.id;
  const template = getTemplate(settings.template);
  const brand = settings.theme_color || template.defaultColor;

  return (
    <div className="m-root" data-template={template.id} style={{ ["--brand" as string]: brand }}>
      <header className="m-hero">
        {settings.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logo_url} alt={settings.name} className="m-logo" />
        ) : (
          <div className="m-logo m-logo-text" aria-hidden="true">{settings.name.trim().charAt(0)}</div>
        )}
        <h1 className="m-title">{settings.name}</h1>
        {settings.tagline && <p className="m-tagline">{settings.tagline}</p>}
        {settings.opening_hours && <p className="m-hours">{settings.opening_hours}</p>}
        <Suspense>
          <TableBadge />
        </Suspense>
      </header>

      <div className="m-bar">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari menu…"
          aria-label="Cari menu"
          className="m-search"
        />
        <nav ref={navRef} className="m-chips no-scrollbar">
          {sections.map(({ category }) => (
            <a
              key={category.id}
              href={`#cat-${category.id}`}
              data-cat={category.id}
              data-active={currentId === category.id || undefined}
              className="m-chip"
            >
              {category.name}
            </a>
          ))}
        </nav>
      </div>

      <main className="m-main">
        {sections.length === 0 && (
          <p className="m-empty">{query ? "Tiada menu dijumpai." : "Menu masih kosong."}</p>
        )}
        {sections.map(({ category, items }) => (
          <section key={category.id} id={`cat-${category.id}`} className="m-section">
            <h2 className="m-cat">{category.name}</h2>
            <ul className="m-items">
              {items.map((item) => (
                <li key={item.id}>
                  <button onClick={() => setSelected(item)} className="m-item" data-off={!item.is_available || undefined}>
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={item.name} loading="lazy" className="m-img" />
                    ) : (
                      <div className="m-img m-img-empty" aria-hidden="true">{item.name.charAt(0)}</div>
                    )}
                    <div className="m-body">
                      <div className="m-top">
                        <h3 className="m-name">{item.name}</h3>
                        <span className="m-leader" aria-hidden="true" />
                        <span className="m-price">{formatPrice(item.price)}</span>
                      </div>
                      {(item.is_popular || !item.is_available) && (
                        <div className="m-badges">
                          {item.is_popular && <span className="m-badge m-badge-pop">⭐ Popular</span>}
                          {!item.is_available && <span className="m-badge m-badge-off">Habis</span>}
                        </div>
                      )}
                      {item.description && <p className="m-desc">{item.description}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <footer className="m-foot">
        {settings.address && <p>{settings.address}</p>}
        {settings.phone && (
          <p>
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a>
          </p>
        )}
        <p className="m-foot-note">Harga tertakluk kepada perubahan.</p>
      </footer>

      {selected && (
        <div className="m-sheet-bg" onClick={() => setSelected(null)}>
          <div className="m-sheet" onClick={(e) => e.stopPropagation()}>
            {selected.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.image_url} alt={selected.name} className="m-sheet-img" />
            )}
            <div className="m-sheet-body">
              <div className="m-sheet-top">
                <h3>{selected.name}</h3>
                <span className="m-price">{formatPrice(selected.price)}</span>
              </div>
              {selected.description && <p className="m-sheet-desc">{selected.description}</p>}
              {!selected.is_available && <p className="m-sheet-off">Maaf, item ini telah habis.</p>}
              <button onClick={() => setSelected(null)} className="m-sheet-close">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
