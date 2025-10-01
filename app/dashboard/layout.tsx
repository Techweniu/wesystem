"use client"

import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Criamos um "usuário" falso para manter a estrutura do cabeçalho.
const FAKE_USER = {
  id: "master-user",
  email: "admin@wesystem.io",
  app_metadata: {},
  user_metadata: {},
  aud: "",
  created_at: "",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Dashboard layout checking authentication")
    const authStatus = localStorage.getItem("isAuthenticated")
    console.log("[v0] Auth status from localStorage:", authStatus)

    if (authStatus === "true") {
      console.log("[v0] User is authenticated")
      setIsAuthenticated(true)
    } else {
      console.log("[v0] User not authenticated, redirecting to login")
      router.push("/auth/login")
    }
  }, [router])

  if (isAuthenticated === null) {
    // Renderiza um estado de carregamento elegante para evitar piscar a tela
    return <div className="flex h-screen w-full items-center justify-center">Carregando sistema...</div>
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
