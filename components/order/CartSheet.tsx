"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { describeOptions } from "@/lib/options";
import type { CartLine } from "@/lib/types";

type Props = {
  lines: CartLine[];
  total: number;
  tableLabel: string;
  mode: "pelanggan" | "pelayan";
  onQty: (key: string, quantity: number) => void;
  onSubmit: (note: string) => Promise<string | null>;
  onClose: () => void;
};

export default function CartSheet({ lines, total, tableLabel, mode, onQty, onSubmit, onClose }: Props) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setError(null);
    const err = await onSubmit(note);
    setSending(false);
    if (err) setError(err);
  }

  return (
    <div className="m-sheet-bg" onClick={sending ? undefined : onClose}>
      <div className="m-sheet m-sheet-tall" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pesanan anda">
        <div className="m-sheet-scroll">
          <div className="m-sheet-body">
            <div className="m-sheet-top">
              <h3>{mode === "pelayan" ? `Order Meja ${tableLabel}` : "Pesanan anda"}</h3>
              <span className="o-table">Meja {tableLabel}</span>
            </div>
            {lines.length === 0 && <p className="m-sheet-desc">Troli kosong. Tekan item untuk tambah.</p>}
            <ul className="o-lines">
              {lines.map((l) => (
                <li key={l.key}>
                  <div className="o-line-main">
                    <b>{l.name}</b>
                    {l.options.length > 0 && <span>{describeOptions(l.options)}</span>}
                    {l.note && <span className="o-line-note">“{l.note}”</span>}
                    <span className="o-line-price">{formatPrice(l.unit * l.quantity)}</span>
                  </div>
                  <div className="o-qty o-qty-sm">
                    <button type="button" onClick={() => onQty(l.key, l.quantity - 1)} aria-label={`Kurang ${l.name}`}>
                      {l.quantity === 1 ? "×" : "−"}
                    </button>
                    <span>{l.quantity}</span>
                    <button type="button" onClick={() => onQty(l.key, l.quantity + 1)} aria-label={`Tambah ${l.name}`}>+</button>
                  </div>
                </li>
              ))}
            </ul>
            {lines.length > 0 && (
              <label className="o-note">
                Catatan untuk seluruh pesanan (pilihan)
                <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="cth. hidang air dulu" />
              </label>
            )}
            {mode === "pelanggan" && lines.length > 0 && <p className="o-hint">Bayar di kaunter seperti biasa.</p>}
            {error && <p className="o-error" role="alert">{error}</p>}
          </div>
        </div>
        <div className="o-actions">
          <button type="button" className="o-secondary" onClick={onClose} disabled={sending}>
            Tambah lagi
          </button>
          <button type="button" className="o-primary" onClick={send} disabled={sending || lines.length === 0}>
            {sending ? "Menghantar…" : `${mode === "pelayan" ? "Hantar ke kru" : "Hantar pesanan"} · ${formatPrice(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
