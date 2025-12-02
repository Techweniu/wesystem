"use client"

import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect, useState, createContext, useContext } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarInset, 
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar" 
import { DashboardSidebarContent } from "@/components/dashboard-sidebar-content" 
import { cn } from "@/lib/utils"

// Usuário estático
const FAKE_USER = {
  id: "master-user",
  email: "admin@wesystem.io",
  app_metadata: {},
  user_metadata: {},
  aud: "",
  created_at: "",
}

// 1. Define o tipo de Papel
type UserRole = "admin" | "limited" | null

// 2. Cria o Contexto do Papel
export const RoleContext = createContext<UserRole>(null)
// 3. Cria um hook customizado para facilitar o uso
export const useRole = () => useContext(RoleContext)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 4. Armazena o 'userRole' no estado
  const [userRole, setUserRole] = useState<UserRole>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // 5. Verifica o 'userRole' no localStorage
    const role = localStorage.getItem("userRole") as UserRole

    // Se não tiver role, manda pro login
    if (role !== "admin" && role !== "limited") {
      router.push("/auth/login")
      return
    }

    // 6. Lógica de Segurança para Usuário Limitado
    if (role === "limited") {
      // Rotas permitidas para o usuário limitado
      const allowedPaths = [
        "/dashboard/clients",
        "/dashboard/org-chart",
        "/dashboard/accesses"
      ]

      // Verifica se o caminho atual começa com algum dos permitidos
      const isAllowed = allowedPaths.some(path => pathname.startsWith(path))

      // Se tentar acessar rota proibida (ex: /dashboard puro, /dashboard/financial), redireciona
      if (!isAllowed) {
        router.push("/dashboard/accesses")
        return
      }
    }

    setUserRole(role)
  }, [router, pathname])

  // 7. Mostra loading enquanto verifica o papel
  if (userRole === null) {
    return <div className="flex h-screen w-full items-center justify-center">Carregando sistema...</div>
  }

  // 8. Fornece o 'userRole' para todos os componentes filhos
  return (
    <RoleContext.Provider value={userRole}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarContent>
            {/* Passa o 'userRole' como prop para a Sidebar */}
            <DashboardSidebarContent userRole={userRole} />
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset> 
          <DashboardHeader user={FAKE_USER} />
          <main className={cn(
            "flex-1 overflow-y-auto p-6", 
            "overflow-x-hidden" 
          )}>
            {children} 
          </main>
        </SidebarInset>
      </SidebarProvider>
    </RoleContext.Provider>
  )
}
