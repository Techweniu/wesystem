"use client" // <-- ESSENCIAL: Este layout agora é client-side

import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
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
import { AuthProvider, useAuth } from "@/contexts/auth-context" // <-- Importa o Provedor

// Componente de Lógica Interno para usar o hook useAuth
function DashboardLayoutLogic({ children }: { children: React.ReactNode }) {
  const { userRole, isLoading } = useAuth() // Obtém a role do contexto
  const router = useRouter()
  const pathname = usePathname()

  if (isLoading || !userRole) {
    // Mostra um loader global enquanto o AuthProvider verifica o localStorage
    return <div className="flex h-screen w-full items-center justify-center">Carregando...</div>
  }

  // Define um usuário "falso" para o Header com base no papel
  const displayUser = {
    email: userRole === 'admin' ? "admin@wesystem.io" : "usuario@wesystem.io"
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* Passa a role para o conteúdo da sidebar */}
        <SidebarContent>
          <DashboardSidebarContent userRole={userRole} />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        {/* Passa o usuário e a role para o header */}
        <DashboardHeader user={displayUser} userRole={userRole} />
        <main className={cn(
          "flex-1 overflow-y-auto p-6",
          "overflow-x-hidden"
        )}>
          {children} {/* Page content */}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Layout principal exportado
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Envolve tudo no AuthProvider
    <AuthProvider>
      <DashboardLayoutLogic>
        {children}
      </DashboardLayoutLogic>
    </AuthProvider>
  )
}
