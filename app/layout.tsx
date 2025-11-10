import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DashboardSidebarContent } from "@/components/dashboard-sidebar-content"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server" // <-- Importa o Server Client
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  let userRole: "admin" | "limited" = "admin" // Padrão

  // Busca o 'system_role' da tabela 'employees'
  const { data: employeeData } = await supabase
    .from("employees")
    .select("system_role")
    .eq("id", user.id)
    .single()

  if (employeeData && employeeData.system_role) {
    userRole = employeeData.system_role
  } else {
    // Se não encontrar, assume admin por segurança (ou 'limited' se preferir)
    console.warn(`Usuário ${user.id} não encontrado na tabela 'employees'. Aplicando role 'admin' padrão.`)
    userRole = "admin"
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
        <DashboardHeader user={user} userRole={userRole} />
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


import './globals.css'

export const metadata = {
      generator: 'v0.app'
    };
