import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr" // Importa o SSR client
import type { CookieOptions } from "@supabase/ssr" // Importa o tipo

// --- INÍCIO: createClient (copiado de lib/supabase/middleware.ts) ---
// Precisamos ter a função aqui para que o middleware seja autossuficiente
export const createClient = (request: NextRequest) => {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )
  return { supabase, response }
}
// --- FIM: createClient ---

// Define as rotas permitidas para o role 'limited'
const limitedUserPaths = [
  "/dashboard/clients",
  "/dashboard/org-chart",
  "/dashboard/accesses",
  "/dashboard/chat",
]

// Função para verificar se o path é permitido
function isPathAllowed(path: string, role: "admin" | "limited") {
  if (role === "admin") {
    return true // Admin pode acessar tudo
  }
  if (role === "limited") {
    // Permite acesso exato ou a sub-rotas (ex: /dashboard/clients/[id])
    return limitedUserPaths.some(allowedPath => path.startsWith(allowedPath));
  }
  return false
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { pathname } = request.nextUrl

  // Atualiza a sessão (essencial)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Redireciona para login se não estiver logado e tentar acessar /dashboard
  if (!session && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redireciona para dashboard se estiver logado e tentar acessar /auth ou a raiz
  if (session && (pathname.startsWith("/auth") || pathname === "/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // --- Início da Lógica de RBAC (Controle de Acesso) ---
  if (session && pathname.startsWith("/dashboard")) {
    // Busca o system_role da tabela 'employees'
    const { data: employee, error } = await supabase
      .from("employees")
      .select("system_role")
      .eq("id", session.user.id) // O ID do usuário logado
      .single()
    
    // Assume 'admin' se não encontrar (segurança)
    const userRole: "admin" | "limited" = employee?.system_role || 'admin'

    // 1. Redirecionamento de Rota Padrão (Conforme seu pedido)
    // Se o usuário 'limited' tentar acessar o Dashboard, redireciona para 'Clientes'
    if (userRole === 'limited' && pathname === '/dashboard') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/clients' // Redireciona para clientes
      return NextResponse.redirect(url)
    }

    // 2. Bloqueio de Rota
    // Se a página não é permitida para o 'role'
    if (!isPathAllowed(pathname, userRole)) {
      // Se não for permitido, redireciona para a página padrão do 'role'
      const defaultPath = userRole === 'limited' ? '/dashboard/clients' : '/dashboard'
      const url = request.nextUrl.clone()
      url.pathname = defaultPath
      return NextResponse.redirect(url)
    }
  }
  // --- Fim da Lógica de RBAC ---

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
