import { NextResponse, type NextRequest } from "next/server"

// O middleware volta a não fazer nada por si só,
// pois a lógica de proteção de rota está no layout do dashboard (client-side).
// A parte crucial é o 'matcher' abaixo.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  /*
   * Esta configuração diz ao sistema para ATIVAR o middleware SOMENTE
   * para as rotas que começam com '/dashboard/'.
   * Todas as outras rotas, incluindo '/auth/login', serão ignoradas.
   */
  matcher: "/dashboard/:path*",
}
