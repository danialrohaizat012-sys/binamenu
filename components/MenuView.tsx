"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartSheet from "@/components/order/CartSheet";
import ItemSheet from "@/components/order/ItemSheet";
import OrderSent from "@/components/order/OrderSent";
import type { OrderingProps } from "@/components/order/types";
import { useCart } from "@/components/order/useCart";
import { formatPrice } from "@/lib/format";
import { toOrderPayload } from "@/lib/options";
import { getTemplate } from "@/lib/templates";
import type { Category, MenuItem, Settings } from "@/lib/types";

type Props = {
  settings: Settings;
  categories: Category[];
  items: MenuItem[];
  // Dari pautan /t/{kod}: meja diketahui
  table?: { label: string; code: string };
  // Ada hanya untuk pelan Smart
  ordering?: OrderingProps;
};

// Struktur sama untuk semua template; rupa setiap template ditentukan
// oleh app/menu-templates.css melalui atribut data-template.
export default function MenuView({ settings, categories, items, table, ordering }: Props) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [sent, setSent] = useState<{ id: string; number: number; total: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const canOrder = Boolean(ordering && table);
  const cart = useCart(table?.code, ordering?.mode === "pelanggan");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((category) => ({
        category,
        items: items.filter(
          (item) =>
            item.category_id === category.id &&
            (!q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)),
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

  const submit = useCallback(
    async (note: string) => {
      if (!ordering || !table) return "Pesanan tidak dibuka.";
      const res = await ordering.submit(table.code, toOrderPayload(cart.lines), note).catch(() => ({
        ok: false as const,
        error: "Tiada sambungan. Sila cuba lagi.",
      }));
      if (!res.ok) return res.error;
      cart.clear();
      setCartOpen(false);
      setSent({ id: res.id, number: res.number, total: res.total });
      return null;
    },
    [ordering, table, cart],
  );

  const checkStatus = useMemo(() => {
    if (!sent || !ordering?.status || !table) return undefined;
    const fn = ordering.status;
    return () => fn(sent.id, table.code);
  }, [sent, ordering, table]);

  const currentId = activeId ?? sections[0]?.category.id;
  const template = getTemplate(settings.template);
  const brand = settings.theme_color || template.defaultColor;

  return (
    <div className="m-root" data-template={template.id} data-ordering={canOrder || undefined} style={{ ["--brand" as string]: brand }}>
      {ordering?.mode === "pelayan" && table && (
        <div className="o-waiter-bar">
          <span>Mod pelayan · <b>Meja {table.label}</b></span>
          {ordering.doneHref && <a href={ordering.doneHref}>Tukar meja</a>}
        </div>
      )}
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
        {table && <span className="m-table">Meja {table.label}</span>}
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
            <a key={category.id} href={`#cat-${category.id}`} data-cat={category.id} data-active={currentId === category.id || undefined} className="m-chip">
              {category.name}
            </a>
          ))}
        </nav>
      </div>

      <main className="m-main">
        {sections.length === 0 && <p className="m-empty">{query ? "Tiada menu dijumpai." : "Menu masih kosong."}</p>}
        {sections.map(({ category, items }) => (
          <section key={category.id} id={`cat-${category.id}`} className="m-section">
            <h2 className="m-cat">{category.name}</h2>
            <ul className="m-items">
              {items.map((item) => {
                const inCart = canOrder ? cart.qtyOf(item.id) : 0;
                return (
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
                        {(item.is_popular || !item.is_available || inCart > 0) && (
                          <div className="m-badges">
                            {inCart > 0 && <span className="m-badge o-incart">×{inCart} dalam troli</span>}
                            {item.is_popular && <span className="m-badge m-badge-pop">⭐ Popular</span>}
                            {!item.is_available && <span className="m-badge m-badge-off">Habis</span>}
                          </div>
                        )}
                        {item.description && <p className="m-desc">{item.description}</p>}
                      </div>
                    </button>
                  </li>
                );
              })}
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

      {canOrder && cart.count > 0 && !cartOpen && !selected && !sent && (
        <button type="button" className="o-cartbar" onClick={() => setCartOpen(true)}>
          <span className="o-count">{cart.count}</span>
          <span>Lihat pesanan</span>
          <b>{formatPrice(cart.total)}</b>
        </button>
      )}

      {selected && (
        <ItemSheet key={selected.id} item={selected} canOrder={canOrder} onAdd={cart.add} onClose={() => setSelected(null)} />
      )}

      {cartOpen && table && ordering && (
        <CartSheet
          lines={cart.lines}
          total={cart.total}
          tableLabel={table.label}
          mode={ordering.mode}
          onQty={cart.setQty}
          onSubmit={submit}
          onClose={() => setCartOpen(false)}
        />
      )}

      {sent && table && (
        <OrderSent
          number={sent.number}
          tableLabel={table.label}
          checkStatus={checkStatus}
          doneHref={ordering?.mode === "pelayan" ? ordering.doneHref : undefined}
          onClose={() => setSent(null)}
        />
      )}
    </div>
  );
}
