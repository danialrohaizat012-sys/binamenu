"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

type Props = {
  number: number;
  total: number;
  tableLabel: string;
  checkStatus?: () => Promise<string | null>;
  doneHref?: string;
  onClose: () => void;
};

const TEXT: Record<string, { title: string; sub: string }> = {
  baru: { title: "Pesanan diterima", sub: "Kru sedang menyediakan pesanan anda." },
  siap: { title: "Pesanan siap", sub: "Pesanan anda sedang dihantar ke meja." },
  batal: { title: "Pesanan dibatalkan", sub: "Sila tanya kru di kaunter." },
};

export default function OrderSent({ number, total, tableLabel, checkStatus, doneHref, onClose }: Props) {
  const [status, setStatus] = useState("baru");

  // Semak status setiap 8 saat sehingga siap atau batal (maksimum 45 minit)
  useEffect(() => {
    if (!checkStatus) return;
    let stop = false;
    const started = Date.now();
    const tick = async () => {
      if (stop || Date.now() - started > 45 * 60 * 1000) return;
      const s = await checkStatus().catch(() => null);
      if (stop) return;
      if (s) setStatus(s);
      if (s !== "siap" && s !== "batal") timer = setTimeout(tick, 8000);
    };
    let timer = setTimeout(tick, 8000);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [checkStatus]);

  const t = TEXT[status] ?? TEXT.baru;
  return (
    <div className="m-sheet-bg">
      <div className="m-sheet o-sent" role="dialog" aria-live="polite">
        <div className="m-sheet-body">
          <div className="o-sent-icon" data-status={status} aria-hidden="true">{status === "batal" ? "!" : "✓"}</div>
          <h3>{doneHref ? "Order dihantar ke kru" : t.title}</h3>
          <p className="m-sheet-desc">{doneHref ? `Meja ${tableLabel} · pesanan #${number}` : t.sub}</p>
          <div className="o-sent-meta">
            <span>Meja {tableLabel}</span>
            <span>#{number}</span>
            <span>{formatPrice(total)}</span>
          </div>
          {doneHref ? (
            <div className="o-sent-actions">
              <a className="o-primary" href={doneHref}>Order meja lain</a>
              <button type="button" className="o-secondary" onClick={onClose}>Tambah untuk meja ini</button>
            </div>
          ) : (
            <button type="button" className="m-sheet-close" onClick={onClose}>
              Tambah pesanan lain
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
