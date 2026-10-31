import { createClient } from "@supabase/supabase-js";

// Klien tanpa sesi untuk halaman menu awam (boleh di-cache)
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
