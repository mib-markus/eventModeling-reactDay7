import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

/**
 * The client is created on first use, not at import time, so mock mode
 * (`VITE_DATA_MODE=mock`) runs with no Supabase credentials configured.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY environment variables');
    }

    client = createClient(supabaseUrl, supabaseAnonKey);
  }

  return client;
}
