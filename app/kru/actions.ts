"use server";

import type { OrderPayloadItem } from "@/components/order/types";
import { createClient } from "@/lib/supabase/server";
import type { PlaceOrderResult } from "@/lib/types";

// Mod pelayan: kru log masuk, jadi place_order() terima sumber "pelayan"
export async function placeWaiterOrder(code: string, items: OrderPayloadItem[], note: string): Promise<PlaceOrderResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_code: code,
    p_items: items,
    p_note: note || null,
    p_source: "pelayan",
  });
  if (error) return { ok: false, error: error.message || "Order gagal dihantar. Sila cuba lagi." };
  return { ok: true, id: data.id, number: data.number, total: Number(data.total) };
}
