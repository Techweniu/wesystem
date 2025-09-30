"use client"

import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // Importamos o useRouter

// Criamos um "usuário" falso para manter a estrutura do cabeçalho.
const FAKE_USER = {
  id: 'master-user',
  email: 'admin@wesystem.io',
  app_metadata: {},
  user_metadata: {},
  aud: '',
  created_at: '',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter() // Inicializamos o roteador

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    } else {
      // AQUI ESTÁ A MUDANÇA: Usamos router.push em vez de redirect
      router.push("/auth/login") 
    }
  }, [router]) // Adicionamos router como dependência do useEffect

  if (isAuthenticated === null) {
    // Renderiza um estado de carregamento elegante para evitar piscar a tela
    return (
        <div className="flex h-screen w-full items-center justify-center">
            Carregando sistema...
        </div>
    )
  }

  if (!isAuthenticated) {
    // Este return é um fallback, o router.push já deve ter feito seu trabalho.
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardHeader user={FAKE_USER} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
