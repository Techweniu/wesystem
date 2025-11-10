import { NextResponse, type NextRequest } from "next/server"

// Este middleware simples apenas permite que a solicitação prossiga.
// A verificação de segurança será feita no client-side, no DashboardLayout.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
