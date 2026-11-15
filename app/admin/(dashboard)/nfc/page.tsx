import Link from "next/link";
import QRCode from "qrcode";
import { getSiteUrl, tableUrl } from "@/lib/site";

export default async function NfcPage({ searchParams }: { searchParams: Promise<{ tables?: string }> }) {
  const { tables } = await searchParams;
  const count = Math.min(Math.max(Number(tables) || 10, 0), 100);
  const base = await getSiteUrl();

  const links = [
    { label: "Umum (tanpa meja)", table: null, url: base },
    ...Array.from({ length: count }, (_, i) => ({ label: `Meja ${i + 1}`, table: String(i + 1), url: tableUrl(base, String(i + 1)) })),
  ];
  const qrs = await Promise.all(links.map((l) => QRCode.toString(l.url, { type: "svg", margin: 1 })));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">NFC & QR</h1>
      <p className="mb-4 text-sm text-stone-600">
        Tulis pautan di bawah ke dalam NFC tag (guna app percuma <b>NFC Tools</b>: Write → Add a record → URL). Cetak QR
        sebagai backup pada stand yang sama.
      </p>
      <div className="mb-6 flex flex-wrap items-end gap-2">
        <form className="flex items-end gap-2">
          <label className="text-sm font-medium">
            Bilangan meja
            <input name="tables" type="number" min={0} max={100} defaultValue={count} className="input mt-1 w-28" />
          </label>
          <button className="btn-secondary">Kemas kini</button>
        </form>
        <Link href={`/admin/nfc/print?tables=${count}`} className="btn-primary">
          Cetak semua sticker 3&quot;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {links.map((l, i) => {
          const sticker = `/admin/nfc/sticker${l.table ? `?meja=${l.table}` : ""}`;
          return (
            <div key={l.url} className="rounded-xl bg-white p-3 text-center shadow-sm">
              <div className="mx-auto w-full max-w-40" dangerouslySetInnerHTML={{ __html: qrs[i] }} />
              <p className="mt-2 font-semibold">{l.label}</p>
              <p className="mt-1 break-all font-mono text-[11px] text-stone-500 select-all">{l.url}</p>
              <a href={sticker} download className="mt-2 inline-block text-xs font-medium text-orange-600 underline">
                Muat turun sticker
              </a>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-stone-500">
        Fail sticker (SVG) termasuk bleed 3mm untuk kedai cetak. Beritahu kedai cetak: potong bulat diameter 76.2mm (3 inci).
      </p>
    </div>
  );
}
