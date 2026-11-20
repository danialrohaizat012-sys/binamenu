"use client";

import { useRef } from "react";
import type { MyOutlet } from "@/lib/staff";

// Tukar outlet aktif (untuk owner/kru yang ada lebih daripada satu outlet)
export default function OutletSwitcher({
  outlets,
  current,
  action,
  dark = false,
}: {
  outlets: MyOutlet[];
  current: string;
  action: (formData: FormData) => Promise<void>;
  dark?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  if (outlets.length < 2) return <span className="font-bold">{outlets.find((o) => o.id === current)?.name}</span>;
  return (
    <form ref={form} action={action}>
      <select
        name="outlet"
        defaultValue={current}
        onChange={() => form.current?.requestSubmit()}
        aria-label="Pilih outlet"
        className={`rounded-lg px-2 py-1 font-bold ${dark ? "bg-white/10 text-white" : "border border-stone-300 bg-white"}`}
      >
        {outlets.map((o) => (
          <option key={o.id} value={o.id} className="text-stone-900">
            {o.name}
          </option>
        ))}
      </select>
    </form>
  );
}
