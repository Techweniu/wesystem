import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

// Configuração das fontes (conforme seu arquivo original)
const gate = localFont({
  src: "../public/fonts/gate-regular.ttf",
  variable: "--font-sans",
  display: "swap",
})

const poppins = localFont({
  src: "../public/fonts/Poppins-Regular.ttf",
  variable: "--font-serif",
  display: "swap",
})

// Metadados só funcionam em Server Components
export const metadata: Metadata = {
  title: "Wesystem",
  description: "Dashboard de Business Intelligence",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${gate.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* ThemeProvider e Toaster são Client Components, mas podem ser usados aqui sem problemas */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
