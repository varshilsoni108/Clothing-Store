import "server-only";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

/**
 * Creates a Supabase client using the service role key.
 * Bypasses RLS — use ONLY in server code for privileged operations
 * (webhook handling, admin escalation). Never ship these credentials to the client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }

  return createSupabaseAdmin(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}