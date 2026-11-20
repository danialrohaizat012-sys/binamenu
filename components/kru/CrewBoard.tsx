"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { describeOptions } from "@/lib/options";
import { createClient } from "@/lib/supabase/client";
import { startOfTodayMyt, timeMyt } from "@/lib/time";
import type { Order, OrderStatus } from "@/lib/types";

type Conn = "live" | "polling" | "offline";

// Bunyi loceng ringkas (perlu ditekan sekali untuk benarkan bunyi dalam pelayar)
function ding(ctx: AudioContext) {
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + i * 0.18;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

function minutesSince(iso: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}

// Papan pesanan masuk untuk kru. Sengaja tiada jumlah RM atau pengurusan bayaran:
// kedai yang ada POS terus guna POS; Bina Menu hanya hantar slip pesanan ikut meja.
export default function CrewBoard({ outletId, initial, loadError }: { outletId: string; initial: Order[]; loadError: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<Record<string, Order>>(() => Object.fromEntries(initial.map((o) => [o.id, o])));
  const [conn, setConn] = useState<Conn>("polling");
  const [tab, setTab] = useState<"baru" | "selesai">("baru");
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(loadError);
  const [soundOn, setSoundOn] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const seen = useRef(new Set(initial.map((o) => o.id)));

  const notify = useCallback(() => {
    if (audio.current) ding(audio.current);
    if ("vibrate" in navigator) navigator.vibrate?.(200);
  }, []);

  const merge = useCallback(
    (list: Order[]) => {
      let fresh = 0;
      for (const o of list) {
        if (!seen.current.has(o.id)) {
          seen.current.add(o.id);
          if (o.status === "baru") fresh++;
        }
      }
      setOrders((prev) => ({ ...prev, ...Object.fromEntries(list.map((o) => [o.id, o])) }));
      if (fresh) notify();
    },
    [notify],
  );

  // Muat semula semua pesanan hari ini: menutup sebarang pesanan yang terlepas semasa sambungan putus
  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("outlet_id", outletId)
      .gte("created_at", startOfTodayMyt().toISOString())
      .order("created_at");
    if (error) {
      setConn((c) => (navigator.onLine ? c : "offline"));
      return;
    }
    setError(null);
    merge((data ?? []) as Order[]);
  }, [supabase, merge, outletId]);

  // Masa nyata melalui Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`pesanan-kru-${outletId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `outlet_id=eq.${outletId}` }, async (payload) => {
        const id = (payload.new as { id?: string })?.id;
        if (!id) return;
        const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
        if (data) merge([data as Order]);
      })
      .subscribe((status) => setConn(status === "SUBSCRIBED" ? "live" : navigator.onLine ? "polling" : "offline"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, merge, outletId]);

  // Semakan berkala sebagai sandaran; lebih kerap bila realtime tidak bersambung
  useEffect(() => {
    const id = setInterval(refresh, conn === "live" ? 30000 : 8000);
    return () => clearInterval(id);
  }, [refresh, conn]);

  useEffect(() => {
    const onOnline = () => {
      setConn("polling");
      refresh();
    };
    const onOffline = () => setConn("offline");
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(tick);
    };
  }, [refresh]);

  const all = useMemo(() => Object.values(orders), [orders]);
  const fresh = useMemo(
    () => all.filter((o) => o.status === "baru").sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [all],
  );
  // Hanya pesanan yang baru selesai (3 jam terakhir), untuk semak semula bila perlu
  const done = useMemo(
    () =>
      all
        .filter((o) => o.status !== "baru" && now - new Date(o.done_at ?? o.created_at).getTime() < 3 * 60 * 60 * 1000)
        .sort((a, b) => (b.done_at ?? b.created_at).localeCompare(a.done_at ?? a.created_at))
        .slice(0, 30),
    [all, now],
  );

  // Tajuk tab tunjuk bilangan pesanan baru. Diulang setiap tick kerana metadata halaman boleh menimpanya.
  useEffect(() => {
    document.title = fresh.length ? `(${fresh.length}) Pesanan baru · Kru` : "Kru · Bina Menu";
  }, [fresh.length, now]);

  async function setStatus(order: Order, status: OrderStatus) {
    const before = order;
    const patch = { status, done_at: status === "baru" ? null : new Date().toISOString() };
    setOrders((prev) => ({ ...prev, [order.id]: { ...order, ...patch } }));
    const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
    if (error) {
      setOrders((prev) => ({ ...prev, [order.id]: before }));
      setError(`Gagal kemas kini pesanan #${order.number}. Semak sambungan dan cuba lagi.`);
    }
  }

  function enableSound() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio.current = audio.current ?? new Ctx();
    audio.current.resume();
    ding(audio.current);
    setSoundOn(true);
  }

  const connText = { live: "Langsung", polling: "Semak setiap 8 saat", offline: "Tiada internet" }[conn];
  const connColor = { live: "bg-emerald-500", polling: "bg-amber-500", offline: "bg-red-500" }[conn];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-stone-200">
          <button onClick={() => setTab("baru")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "baru" ? "bg-[#0f2347] text-white" : "text-stone-600"}`}>
            Baru ({fresh.length})
          </button>
          <button onClick={() => setTab("selesai")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "selesai" ? "bg-[#0f2347] text-white" : "text-stone-600"}`}>
            Baru selesai ({done.length})
          </button>
        </div>
        <span className="flex items-center gap-2 text-sm text-stone-600" aria-live="polite">
          <span className={`h-2.5 w-2.5 rounded-full ${connColor}`} />
          {connText}
        </span>
        <button
          onClick={enableSound}
          className={`ml-auto rounded-full px-4 py-2 text-sm font-semibold ${soundOn ? "bg-emerald-100 text-emerald-800" : "bg-amber-400 text-stone-900"}`}
        >
          {soundOn ? "🔔 Bunyi aktif (uji)" : "🔕 Hidupkan bunyi loceng"}
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

      {tab === "baru" && (
        <>
          {fresh.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center text-stone-500 shadow-sm">
              <p className="text-lg font-semibold text-stone-700">Tiada pesanan baru</p>
              <p className="mt-1 text-sm">Pesanan dari meja akan muncul di sini dengan bunyi loceng.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fresh.map((o) => {
              const mins = minutesSince(o.created_at, now);
              return (
                <article key={o.id} className={`flex flex-col rounded-2xl bg-white shadow-sm ring-2 ${mins >= 10 ? "ring-red-400" : "ring-transparent"}`}>
                  <header className="flex items-start justify-between gap-2 border-b border-stone-100 px-4 pt-4 pb-3">
                    <div>
                      <p className="text-3xl leading-none font-extrabold text-[#0f2347]">Meja {o.table_label}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        #{o.number} · {timeMyt(o.created_at)} · {o.source === "pelayan" ? "Pelayan" : "Pelanggan"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${mins >= 10 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                      {mins === 0 ? "Baru" : `${mins} min`}
                    </span>
                  </header>
                  <ul className="flex-1 space-y-2 px-4 py-3">
                    {o.order_items.map((it) => (
                      <li key={it.id} className="text-[15px]">
                        <span className="font-bold">{it.quantity}×</span> {it.name}
                        {it.options.length > 0 && <span className="block text-sm font-semibold text-emerald-700">{describeOptions(it.options)}</span>}
                        {it.note && <span className="block text-sm font-semibold text-red-700">“{it.note}”</span>}
                      </li>
                    ))}
                    {o.note && <li className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Catatan: {o.note}</li>}
                  </ul>
                  <footer className="border-t border-stone-100 p-3">
                    <button onClick={() => setStatus(o, "siap")} className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">
                      Selesai
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        </>
      )}

      {tab === "selesai" && (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">Pesanan yang ditanda selesai dalam 3 jam terakhir. Tekan &quot;Buka semula&quot; jika tersalah tekan.</p>
          {done.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-stone-500">Tiada pesanan.</p>}
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl bg-white shadow-sm">
            {done.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="w-24 font-bold text-[#0f2347]">Meja {o.table_label}</span>
                <span className="text-sm text-stone-500">#{o.number} · {timeMyt(o.created_at)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{o.order_items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</span>
                <button onClick={() => setStatus(o, "baru")} className="text-sm font-semibold text-stone-500 hover:text-stone-900">Buka semula</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
