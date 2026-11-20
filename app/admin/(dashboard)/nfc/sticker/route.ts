import { requireOwner } from "@/lib/staff";
import { getSiteUrl, tableUrl } from "@/lib/site";
import { stickerSvg } from "@/lib/sticker";

// Muat turun sticker meja saiz kad bank (SVG, dengan bleed 3mm untuk kedai cetak)
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("kod");
  const { supabase, outlet } = await requireOwner();
  const [{ data: settings }, { data: table }] = await Promise.all([
    supabase.from("outlets").select("name").eq("id", outlet.id).single(),
    code
      ? supabase.from("dining_tables").select("label, code").eq("code", code).eq("outlet_id", outlet.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (code && !table) return new Response("Meja tidak dijumpai", { status: 404 });

  const svg = stickerSvg({
    name: settings?.name ?? "Menu",
    url: tableUrl(await getSiteUrl(), table?.code),
    table: table?.label,
    bleed: params.get("bleed") !== "0",
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="sticker-${table ? `meja-${table.label}` : "umum"}.svg"`,
    },
  });
}
