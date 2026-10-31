import { headers } from "next/headers";
import QRCode from "qrcode";

export default async function NfcPage({ searchParams }: { searchParams: Promise<{ tables?: string }> }) {
  const { tables } = await searchParams;
  const count = Math.min(Math.max(Number(tables) || 10, 0), 100);

  const h = await headers();
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const links = [
    { label: "Umum (tanpa meja)", url: base },
    ...Array.from({ length: count }, (_, i) => ({ label: `Meja ${i + 1}`, url: `${base}/?meja=${i + 1}` })),
  ];
  const qrs = await Promise.all(links.map((l) => QRCode.toString(l.url, { type: "svg", margin: 1 })));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">NFC & QR</h1>
      <p className="mb-4 text-sm text-stone-600">
        Tulis pautan di bawah ke dalam NFC tag (guna app percuma <b>NFC Tools</b>: Write → Add a record → URL). Cetak QR
        sebagai backup pada stand yang sama.
      </p>
      <form className="mb-6 flex items-end gap-2 print:hidden">
        <label className="text-sm font-medium">
          Bilangan meja
          <input name="tables" type="number" min={0} max={100} defaultValue={count} className="input mt-1 w-28" />
        </label>
        <button className="btn-secondary">Kemas kini</button>
      </form>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {links.map((l, i) => (
          <div key={l.url} className="rounded-xl bg-white p-3 text-center shadow-sm break-inside-avoid">
            <div className="mx-auto w-full max-w-40" dangerouslySetInnerHTML={{ __html: qrs[i] }} />
            <p className="mt-2 font-semibold">{l.label}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-stone-500 select-all">{l.url}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
