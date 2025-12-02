// bi-dashboard (4)/app/dashboard/layout.tsx
"use client"

import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect, useState, createContext, useContext } from "react" // <-- Importa Context
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarInset, // Ensure this is imported
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar" // Verify import path
import { DashboardSidebarContent } from "@/components/dashboard-sidebar-content" // Verify import path
import { cn } from "@/lib/utils"

// Usuário estático (como era antes)
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

  useEffect(() => {
    // 5. Verifica o 'userRole' no localStorage
    const role = localStorage.getItem("userRole")
    if (role === "admin" || role === "limited") {
      setUserRole(role)
    } else {
      router.push("/auth/login")
    }
  }, [router])

  // 6. Mostra loading enquanto verifica o papel
  if (userRole === null) {
    return <div className="flex h-screen w-full items-center justify-center">Carregando sistema...</div>
  }

  // 7. Fornece o 'userRole' para todos os componentes filhos
  return (
    <RoleContext.Provider value={userRole}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarContent>
            {/* 8. Passa o 'userRole' como prop para a Sidebar */}
            <DashboardSidebarContent userRole={userRole} />
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset> {/* Container for Header and Main */}
          <DashboardHeader user={FAKE_USER} />
          <main className={cn(
            "flex-1 overflow-y-auto p-6", // Existing classes
            "overflow-x-hidden" // Prevents main content from scrolling horizontally
          )}>
            {children} {/* O {children} (páginas) receberá o 'userRole' via Context */}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </RoleContext.Provider>
  )
}
