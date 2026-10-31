export const TEMPLATES = [
  {
    id: "klasik",
    name: "Klasik",
    description: "Senarai bersih dengan gambar kecil. Sesuai untuk semua jenis kedai.",
    defaultColor: "#ea580c",
  },
  {
    id: "kafe",
    name: "Kafe",
    description: "Kad bergambar dua lajur. Paling cantik kalau setiap item ada gambar.",
    defaultColor: "#9a5b34",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Latar gelap dan huruf serif, gaya restoran mewah.",
    defaultColor: "#d4a24c",
  },
  {
    id: "warung",
    name: "Warung",
    description: "Huruf besar dan warna terang. Mudah dibaca, sesuai kedai makan.",
    defaultColor: "#dc2626",
  },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export function getTemplate(id: string | null | undefined) {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
