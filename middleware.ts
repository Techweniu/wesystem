import { NextResponse, type NextRequest } from "next/server"

// O middleware agora é apenas um pass-through.
// A lógica de autenticação está no layout do dashboard.
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
