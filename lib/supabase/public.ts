import { createClient } from "@supabase/supabase-js"

/**
 * Creates a public Supabase client that doesn't require authentication.
 * Use this for public pages like NPS forms.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}
