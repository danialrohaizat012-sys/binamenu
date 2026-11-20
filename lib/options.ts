import type { CartLine, ChosenOption, MenuItem, OptionGroup } from "@/lib/types";

const MAX_GROUPS = 8;
const MAX_CHOICES = 15;

// Semak JSON pilihan dari borang admin. Pangkalan data semak semula semasa pesanan dibuat.
export function parseOptions(raw: string): OptionGroup[] {
  let data: unknown;
  try {
    data = JSON.parse(raw || "[]");
  } catch {
    throw new Error("Pilihan item tidak dapat dibaca.");
  }
  if (!Array.isArray(data)) throw new Error("Pilihan item tidak sah.");
  if (data.length > MAX_GROUPS) throw new Error(`Maksimum ${MAX_GROUPS} kumpulan pilihan.`);

  const seen = new Set<string>();
  return data.map((g): OptionGroup => {
    const name = String(g?.name ?? "").trim().slice(0, 40);
    if (!name) throw new Error("Setiap kumpulan pilihan perlukan nama, cth. Gula.");
    if (seen.has(name.toLowerCase())) throw new Error(`Nama kumpulan "${name}" berulang.`);
    seen.add(name.toLowerCase());

    const choices: unknown[] = Array.isArray(g?.choices) ? g.choices : [];
    const names = new Set<string>();
    const clean = choices
      .map((c) => {
        const o = c as { name?: unknown; price?: unknown };
        return { name: String(o?.name ?? "").trim().slice(0, 40), price: Math.round(Number(o?.price || 0) * 100) / 100 };
      })
      .filter((c) => c.name);
    for (const c of clean) {
      if (!Number.isFinite(c.price) || c.price < 0 || c.price > 999) throw new Error(`Harga tambahan "${c.name}" tidak sah.`);
      if (names.has(c.name.toLowerCase())) throw new Error(`Pilihan "${c.name}" berulang dalam ${name}.`);
      names.add(c.name.toLowerCase());
    }
    if (clean.length === 0) throw new Error(`Kumpulan "${name}" perlukan sekurang-kurangnya satu pilihan.`);
    if (clean.length > MAX_CHOICES) throw new Error(`Maksimum ${MAX_CHOICES} pilihan dalam ${name}.`);
    return { name, required: Boolean(g?.required), multi: Boolean(g?.multi), choices: clean };
  });
}

// Pilihan yang dipilih pelanggan: { [nama kumpulan]: [nama pilihan] }
export type Selection = Record<string, string[]>;

export function chosenOptions(item: MenuItem, sel: Selection): ChosenOption[] {
  return (item.options ?? []).flatMap((g) =>
    g.choices.filter((c) => sel[g.name]?.includes(c.name)).map((c) => ({ group: g.name, choice: c.name, price: c.price })),
  );
}

export function missingGroups(item: MenuItem, sel: Selection) {
  return (item.options ?? []).filter((g) => g.required && !(sel[g.name]?.length)).map((g) => g.name);
}

export function unitPrice(item: MenuItem, chosen: ChosenOption[]) {
  return Math.round((Number(item.price) + chosen.reduce((s, c) => s + c.price, 0)) * 100) / 100;
}

export function lineKey(itemId: string, chosen: ChosenOption[], note: string) {
  return [itemId, ...chosen.map((c) => `${c.group}:${c.choice}`).sort(), note.trim().toLowerCase()].join("|");
}

// Bentuk yang dihantar ke place_order()
export function toOrderPayload(lines: CartLine[]) {
  return lines.map((l) => ({
    item_id: l.item_id,
    quantity: l.quantity,
    note: l.note.trim() || null,
    options: l.options.map((o) => ({ group: o.group, choice: o.choice })),
  }));
}

export function describeOptions(options: ChosenOption[]) {
  return options.map((o) => o.choice).join(", ");
}
