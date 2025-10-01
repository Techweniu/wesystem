import { NextResponse, type NextRequest } from "next/server"

// O middleware continua sendo um pass-through, a lógica de proteção está no layout.
// O importante é ajustar o 'matcher' para que ele não intercepte rotas públicas.
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * MUDANÇA AQUI:
     * Agora o middleware SÓ será ativado para rotas dentro de '/dashboard'.
     * Rotas como '/nps' ou '/auth' serão completamente ignoradas,
     * e a Vercel não tentará protegê-las.
     */
    "/dashboard/:path*",
  ],
}
