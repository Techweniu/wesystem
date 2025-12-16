import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

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
  title: "Wesystem",
  description: "Dashboard de Business Intelligence",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        href: "/favicon.png",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${gate.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
