"use server";

import type { OrderPayloadItem } from "@/components/order/types";
import { createPublicClient } from "@/lib/supabase/public";
import type { PlaceOrderResult } from "@/lib/types";

// Pesanan pelanggan. Harga & pilihan disemak semula oleh place_order() dalam pangkalan data.
export async function placeCustomerOrder(code: string, items: OrderPayloadItem[], note: string): Promise<PlaceOrderResult> {
  const { data, error } = await createPublicClient().rpc("place_order", {
    p_code: code,
    p_items: items,
    p_note: note || null,
    p_source: "pelanggan",
  });
  if (error) return { ok: false, error: error.message || "Pesanan gagal dihantar. Sila cuba lagi." };
  return { ok: true, id: data.id, number: data.number, total: Number(data.total) };
}

export async function customerOrderStatus(orderId: string, code: string): Promise<string | null> {
  const { data } = await createPublicClient().rpc("order_status", { p_order: orderId, p_code: code });
  return (data as string | null) ?? null;
}
