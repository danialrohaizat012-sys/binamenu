"use client";

import { useSearchParams } from "next/navigation";

// Dibaca di pelayar supaya halaman menu kekal statik & laju
export default function TableBadge() {
  const table = useSearchParams().get("meja");
  if (!table) return null;
  return <span className="m-table">Meja {table}</span>;
}
