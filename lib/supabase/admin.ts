import { createClient } from "@supabase/supabase-js";

// Trusted server-only client (bypasses RLS). NEVER import into client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
