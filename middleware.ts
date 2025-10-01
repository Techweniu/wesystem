import { NextResponse, type NextRequest } from "next/server"

// O middleware continua a não fazer nada, a mudança está na configuração abaixo.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - auth (nossas páginas de login)
   * - nps (nosso formulário público)
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth|nps).*)'
  ],
}
