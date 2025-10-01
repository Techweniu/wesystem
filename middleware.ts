import { NextResponse, type NextRequest } from "next/server"

// O middleware continua a não fazer nada por si só,
// pois a nossa lógica de proteção de rota está no layout do dashboard.
// A parte crucial é o 'matcher' abaixo.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  /*
   * A REGRA DE OURO:
   * Esta configuração diz ao sistema para ATIVAR o middleware SOMENTE
   * para as rotas que começam com '/dashboard/'.
   * Todas as outras rotas, incluindo '/nps/[...]', '/auth/login', e a página inicial,
   * serão completamente ignoradas pelo middleware.
   * Isso informa à Vercel que essas rotas são públicas e não precisam de proteção.
   */
  matcher: "/dashboard/:path*",
}
