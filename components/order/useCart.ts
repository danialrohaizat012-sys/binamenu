"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";

// Troli disimpan dalam pelayar ikut meja supaya tak hilang bila halaman dimuat semula
export function useCart(code: string | undefined, persist: boolean) {
  const storageKey = code ? `binamenu-troli-${code}` : null;
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    if (!persist || !storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setLines(JSON.parse(saved));
    } catch {
      // Storan tidak tersedia; troli kekal dalam memori sahaja
    }
  }, [persist, storageKey]);

  useEffect(() => {
    if (!persist || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {}
  }, [lines, persist, storageKey]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const same = prev.find((l) => l.key === line.key);
      if (!same) return [...prev, line];
      return prev.map((l) => (l.key === line.key ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l));
    });
  }, []);

  const setQty = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const total = useMemo(() => Math.round(lines.reduce((s, l) => s + l.unit * l.quantity, 0) * 100) / 100, [lines]);
  const qtyOf = useCallback((itemId: string) => lines.filter((l) => l.item_id === itemId).reduce((s, l) => s + l.quantity, 0), [lines]);

  return { lines, add, setQty, clear, count, total, qtyOf };
}
