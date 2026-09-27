// Server Components aur API routes ke liye. Abhi Phase 0 me hum sirf
// public/anon-key reads kar rahe hain (no auth yet), isliye yeh client
// simple rakha hai. Jab auth add karoge, isme cookie-based session
// handling (via @supabase/ssr) add karna hoga.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types";

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
