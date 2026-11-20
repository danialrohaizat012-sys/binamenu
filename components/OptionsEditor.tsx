"use client";

import { useState } from "react";
import type { OptionGroup } from "@/lib/types";

const PRESETS: OptionGroup[] = [
  { name: "Gula", required: true, multi: false, choices: [{ name: "Biasa", price: 0 }, { name: "Kurang manis", price: 0 }, { name: "Tanpa gula", price: 0 }] },
  { name: "Suhu", required: true, multi: false, choices: [{ name: "Panas", price: 0 }, { name: "Ais", price: 0.5 }] },
  { name: "Pedas", required: false, multi: false, choices: [{ name: "Tak pedas", price: 0 }, { name: "Sederhana", price: 0 }, { name: "Pedas", price: 0 }] },
  { name: "Tambahan", required: false, multi: true, choices: [{ name: "Telur mata", price: 1.5 }, { name: "Keju", price: 2 }] },
];

// Editor pilihan item untuk borang admin. Nilai dihantar sebagai JSON dalam input "options".
export default function OptionsEditor({ initial }: { initial: OptionGroup[] }) {
  const [groups, setGroups] = useState<OptionGroup[]>(initial);

  const update = (i: number, patch: Partial<OptionGroup>) => setGroups((g) => g.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const updateChoice = (i: number, k: number, patch: Partial<{ name: string; price: number }>) =>
    update(i, { choices: groups[i].choices.map((c, j) => (j === k ? { ...c, ...patch } : c)) });

  return (
    <div className="space-y-3">
      <input type="hidden" name="options" value={JSON.stringify(groups)} />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">Pilihan item</span>
        <span className="text-stone-500">cth. kurang manis, ais, tahap pedas</span>
      </div>

      {groups.map((g, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-stone-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={g.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Nama kumpulan, cth. Gula"
              className="input min-w-40 flex-1"
              aria-label="Nama kumpulan pilihan"
            />
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={g.required} onChange={(e) => update(i, { required: e.target.checked })} /> Wajib pilih
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={g.multi} onChange={(e) => update(i, { multi: e.target.checked })} /> Boleh pilih banyak
            </label>
            <button type="button" onClick={() => setGroups((x) => x.filter((_, j) => j !== i))} className="text-sm text-red-600">
              Buang
            </button>
          </div>
          {g.choices.map((c, k) => (
            <div key={k} className="flex items-center gap-2 pl-2">
              <input value={c.name} onChange={(e) => updateChoice(i, k, { name: e.target.value })} placeholder="Pilihan" className="input flex-1" aria-label="Nama pilihan" />
              <span className="text-sm text-stone-500">+RM</span>
              <input
                type="number"
                step="0.10"
                min="0"
                value={c.price}
                onChange={(e) => updateChoice(i, k, { price: Number(e.target.value) })}
                className="input w-24"
                aria-label="Harga tambahan"
              />
              <button type="button" onClick={() => update(i, { choices: g.choices.filter((_, j) => j !== k) })} className="px-2 text-stone-400 hover:text-red-600" aria-label="Buang pilihan">
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => update(i, { choices: [...g.choices, { name: "", price: 0 }] })} className="pl-2 text-sm font-medium text-orange-600">
            + Tambah pilihan
          </button>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setGroups((x) => [...x, { name: "", required: false, multi: false, choices: [{ name: "", price: 0 }] }])} className="btn-secondary text-sm">
          + Kumpulan pilihan
        </button>
        {PRESETS.filter((p) => !groups.some((g) => g.name === p.name)).map((p) => (
          <button key={p.name} type="button" onClick={() => setGroups((x) => [...x, structuredClone(p)])} className="rounded-lg bg-stone-100 px-3 py-2 text-sm hover:bg-stone-200">
            + {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
