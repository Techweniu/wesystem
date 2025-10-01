import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a Supabase server client for use in Server Components.
 */
export async function createClient() {
  const cookieStore = cookies()

  // Este cliente é para LER dados em Server Components.
  // Vamos usar a chave de serviço para garantir que ele possa ler tudo,
  // bypassando o RLS se necessário.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, // Usando a chave mestra para ler dados
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorar erros em Server Components é seguro se o middleware estiver tratando a sessão.
          }
        },
      },
    }
  )
}
