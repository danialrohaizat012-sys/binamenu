"use client";

import { useSearchParams } from "next/navigation";

// Dibaca di pelayar supaya halaman menu kekal statik & laju
export default function TableBadge({ color }: { color: string }) {
  const table = useSearchParams().get("meja");
  if (!table) return null;
  return (
    <span className="mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ background: color }}>
      Meja {table}
    </span>
  );
}
