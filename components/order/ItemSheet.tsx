"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { chosenOptions, lineKey, missingGroups, unitPrice, type Selection } from "@/lib/options";
import type { CartLine, MenuItem } from "@/lib/types";

type Props = {
  item: MenuItem;
  canOrder: boolean;
  onAdd: (line: CartLine) => void;
  onClose: () => void;
};

export default function ItemSheet({ item, canOrder, onAdd, onClose }: Props) {
  const [sel, setSel] = useState<Selection>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);

  const chosen = chosenOptions(item, sel);
  const unit = unitPrice(item, chosen);
  const missing = missingGroups(item, sel);
  const groups = item.options ?? [];

  function toggle(group: string, choice: string, multi: boolean) {
    setSel((prev) => {
      const current = prev[group] ?? [];
      if (!multi) return { ...prev, [group]: current[0] === choice ? [] : [choice] };
      return { ...prev, [group]: current.includes(choice) ? current.filter((c) => c !== choice) : [...current, choice] };
    });
  }

  function add() {
    setTried(true);
    if (missing.length) return;
    onAdd({ key: lineKey(item.id, chosen, note), item_id: item.id, name: item.name, unit, quantity: qty, options: chosen, note: note.trim() });
    onClose();
  }

  return (
    <div className="m-sheet-bg" onClick={onClose}>
      <div className="m-sheet m-sheet-tall" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={item.name}>
        <div className="m-sheet-scroll">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.name} className="m-sheet-img" />
          )}
          <div className="m-sheet-body">
            <div className="m-sheet-top">
              <h3>{item.name}</h3>
              <span className="m-price">{formatPrice(item.price)}</span>
            </div>
            {item.description && <p className="m-sheet-desc">{item.description}</p>}
            {!item.is_available && <p className="m-sheet-off">Maaf, item ini telah habis.</p>}

            {canOrder && item.is_available && (
              <>
                {groups.map((g) => {
                  const bad = tried && missing.includes(g.name);
                  return (
                    <fieldset key={g.name} className="o-group" data-bad={bad || undefined}>
                      <legend>
                        {g.name}
                        <span className="o-req">{g.required ? (g.multi ? "Wajib · boleh pilih banyak" : "Wajib · pilih satu") : g.multi ? "Pilihan · boleh pilih banyak" : "Pilihan"}</span>
                      </legend>
                      {g.choices.map((c) => {
                        const on = sel[g.name]?.includes(c.name) ?? false;
                        return (
                          <label key={c.name} className="o-choice" data-on={on || undefined}>
                            <input type={g.multi ? "checkbox" : "radio"} name={`g-${g.name}`} checked={on} onChange={() => toggle(g.name, c.name, g.multi)} />
                            <span>{c.name}</span>
                            {c.price > 0 && <span className="o-plus">+{formatPrice(c.price)}</span>}
                          </label>
                        );
                      })}
                      {bad && <p className="o-err">Sila pilih {g.name.toLowerCase()}.</p>}
                    </fieldset>
                  );
                })}
                <label className="o-note">
                  Catatan untuk dapur (pilihan)
                  <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 140))} placeholder="cth. tak nak sayur, kuah asing" />
                </label>
              </>
            )}
          </div>
        </div>

        <div className="o-actions">
          {canOrder && item.is_available ? (
            <>
              <div className="o-qty" aria-label="Kuantiti">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurang">−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Tambah">+</button>
              </div>
              <button type="button" className="o-primary" onClick={add}>
                Tambah · {formatPrice(unit * qty)}
              </button>
            </>
          ) : (
            <button type="button" className="m-sheet-close" onClick={onClose}>
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
