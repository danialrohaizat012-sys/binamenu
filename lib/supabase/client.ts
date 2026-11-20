import { createBrowserClient } from "@supabase/ssr";

// Klien pelayar dengan sesi log masuk (skrin kru: realtime & tukar status)
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
