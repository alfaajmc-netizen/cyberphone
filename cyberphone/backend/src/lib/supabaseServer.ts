import { createClient } from "@supabase/supabase-js";
import { getSecret } from "../utils/secrets";

/**
 * Server-side Supabase client (use SERVICE_ROLE_KEY)
 * Usage: import { supabaseAdmin } from "../lib/supabaseServer";
 */
const SUPABASE_URL = getSecret("SUPABASE_URL") || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = getSecret("SUPABASE_SERVICE_ROLE_KEY") || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase server client is missing keys. Set SUPABASE_SERVICE_ROLE_KEY in env or encrypted secrets.");
}

export const supabaseAdmin = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY || "", {
  // server options
  auth: { persistSession: false },
});