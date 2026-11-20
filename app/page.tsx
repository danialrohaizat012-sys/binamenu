import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bina Menu" };

// Domain app hanya untuk menu outlet (/t/{kod}, /m/{slug}) dan log masuk kedai.
export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6 text-center">
      <div>
        <p className="text-2xl font-extrabold text-[#0f2347]">Bina Menu</p>
        <p className="mt-2 text-stone-600">Tap sticker di meja atau imbas QR untuk buka menu kedai.</p>
        <div className="mt-6 flex justify-center gap-3 text-sm">
          <a href="https://binamenu.binalab.my" className="btn-primary">Tentang Bina Menu</a>
          <a href="/admin/login" className="btn-secondary">Log masuk kedai</a>
        </div>
      </div>
    </main>
  );
}
