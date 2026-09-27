// Browser me use hoga (client components). Yeh ek singleton Supabase client
// banata hai using the public URL + anon key — safe to expose in the browser.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
