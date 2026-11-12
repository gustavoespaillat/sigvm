"use client";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";

let instance: ReturnType<typeof createClient> | undefined;
export function getSupabaseBrowserClient() {
  if (!instance) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getSupabasePublicEnv();
    instance = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return instance;
}
