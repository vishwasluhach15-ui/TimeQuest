// Browser me use hoga (client components).
//
// Do design notes:
// 1. Untyped client (no <Database> generic) — supabase-js v2's generic
//    schema typing is strict enough that a small mismatch makes query
//    results silently collapse to `never`, which breaks the build. Cast
//    to our own types (lib/types.ts) at the call site instead.
// 2. Lazy singleton — the client is only actually created the first time
//    getSupabaseClient() is called, not the moment this file is imported.
//    Next.js evaluates page modules on the server during the build itself
//    (even for pages that render per-request), so an eagerly-created
//    top-level client throws "supabaseUrl is required" and fails the
//    whole deployment if env vars aren't set at that exact moment.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase environment variables are missing. Check .env.local locally, or your Vercel project's Environment Variables in production."
      );
    }
    cachedClient = createClient(url, key);
  }
  return cachedClient;
}
