"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/* Browser Supabase client for the admin area. Shares the same cookie session
   as the server, so Storage uploads run as the signed-in owner and the
   `product-images` bucket's admin-write policy authorises them. Singleton. */
export function supabaseBrowser(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  client = createBrowserClient(url, anon);
  return client;
}
