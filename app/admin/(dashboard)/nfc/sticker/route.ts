import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, tableUrl } from "@/lib/site";
import { stickerSvg } from "@/lib/sticker";
import { getTemplate } from "@/lib/templates";

// Muat turun sticker meja (SVG, dengan bleed 3mm untuk kedai cetak)
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("kod");
  const supabase = await createClient();
  const [{ data: settings }, { data: table }] = await Promise.all([
    supabase.from("settings").select("name, theme_color, template").eq("id", 1).single(),
    code ? supabase.from("dining_tables").select("label, code").eq("code", code).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (code && !table) return new Response("Meja tidak dijumpai", { status: 404 });

  const svg = stickerSvg({
    name: settings?.name ?? "Menu",
    url: tableUrl(await getSiteUrl(), table?.code),
    table: table?.label,
    color: settings?.theme_color || getTemplate(settings?.template).defaultColor,
    bleed: params.get("bleed") !== "0",
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="sticker-${table ? `meja-${table.label}` : "umum"}.svg"`,
    },
  });
}
