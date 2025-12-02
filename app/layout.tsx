import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner" // <-- Importando Toaster do componente customizado ao invés de diretamente do sonner
import { ThemeProvider } from "@/components/theme-provider" // <-- Importe o ThemeProvider

// Carregamento das fontes locais (como no seu arquivo original)
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

export const metadata: Metadata = {
  title: "wesystemv1",
  description: "Dashboard de Business Intelligence para agências",
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
        {/* Envolvemos o children com o ThemeProvider que estava no 'undefined' */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
