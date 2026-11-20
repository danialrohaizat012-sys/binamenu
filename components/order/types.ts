import type { PlaceOrderResult } from "@/lib/types";

export type OrderPayloadItem = {
  item_id: string;
  quantity: number;
  note: string | null;
  options: { group: string; choice: string }[];
};

export type OrderingProps = {
  mode: "pelanggan" | "pelayan";
  submit: (code: string, items: OrderPayloadItem[], note: string) => Promise<PlaceOrderResult>;
  status?: (orderId: string, code: string) => Promise<string | null>;
  // Mod pelayan: pautan untuk pilih meja lain
  doneHref?: string;
};
