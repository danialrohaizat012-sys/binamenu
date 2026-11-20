export type Settings = {
  id: number;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  opening_hours: string | null;
  theme_color: string;
  template: string;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  sort_order: number;
  options: OptionGroup[];
};

export type OptionChoice = { name: string; price: number };

// Kumpulan pilihan item, cth. Gula: Biasa / Kurang manis (pilih satu, wajib)
export type OptionGroup = { name: string; required: boolean; multi: boolean; choices: OptionChoice[] };

export type ChosenOption = { group: string; choice: string; price: number };

export type Plan = "lite" | "smart" | "pro";

export type DiningTable = {
  id: string;
  label: string;
  code: string;
  is_active: boolean;
  sort_order: number;
};

export type OrderStatus = "baru" | "siap" | "batal";

export type OrderItem = {
  id: string;
  order_id: string;
  item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  options: ChosenOption[];
  note: string | null;
  line_total: number;
};

export type Order = {
  id: string;
  number: number;
  table_id: string | null;
  table_label: string;
  source: "pelanggan" | "pelayan";
  status: OrderStatus;
  note: string | null;
  total: number;
  created_at: string;
  done_at: string | null;
  order_items: OrderItem[];
};

// Satu baris dalam troli sebelum dihantar
export type CartLine = {
  key: string;
  item_id: string;
  name: string;
  unit: number;
  quantity: number;
  options: ChosenOption[];
  note: string;
};

export type PlaceOrderResult =
  | { ok: true; id: string; number: number; total: number }
  | { ok: false; error: string };
