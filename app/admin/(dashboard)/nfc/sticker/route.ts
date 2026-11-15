import { createPublicClient } from "@/lib/supabase/public";
import { getSiteUrl, tableUrl } from "@/lib/site";
import { stickerSvg } from "@/lib/sticker";
import { getTemplate } from "@/lib/templates";

// Muat turun sticker bulat 3 inci (SVG, dengan bleed 3mm untuk kedai cetak)
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const table = params.get("meja");
  const { data } = await createPublicClient().from("settings").select("name, theme_color, template").eq("id", 1).single();

  const svg = stickerSvg({
    name: data?.name ?? "Menu",
    url: tableUrl(await getSiteUrl(), table),
    table,
    color: data?.theme_color || getTemplate(data?.template).defaultColor,
    bleed: params.get("bleed") !== "0",
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="sticker-${table ? `meja-${table}` : "umum"}.svg"`,
    },
  });
}
