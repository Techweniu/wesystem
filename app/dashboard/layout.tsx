"use client"

import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect } from "react" // Removido useState
import { useRouter, usePathname } from "next/navigation" // Adicionado usePathname
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
  const { userRole, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return // Não faz nada enquanto carrega

    // Se o usuário for 'limited' e estiver na raiz do dashboard, redireciona
    if (userRole === 'limited' && pathname === '/dashboard') {
      router.replace('/dashboard/clients')
    }
    
    // O AuthProvider já lida com o redirecionamento para /auth/login se não houver role

  }, [userRole, isLoading, router, pathname])

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Carregando sistema...</div>
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
        {/* Passa a role para o header */}
        <DashboardHeader userRole={userRole} />
        <main className={cn(
          "flex-1 overflow-y-auto p-6",
          "overflow-x-hidden"
        )}>
          {children} {/* Conteúdo da página */}
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
