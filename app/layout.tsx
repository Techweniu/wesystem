import type React from "react"
import type { Metadata } from "next"
import { Poppins } from 'next/font/google' // 1. Importar a fonte Poppins
import "./globals.css"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"

// 2. Configurar a fonte Poppins
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans', // Define uma variável CSS para a fonte
});

export const metadata: Metadata = {
  title: "wesystem",
  description: "Dashboard de Business Intelligence para agênciass",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // 3. Aplicar a classe da fonte ao HTML
    <html lang="pt-BR" className={poppins.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
