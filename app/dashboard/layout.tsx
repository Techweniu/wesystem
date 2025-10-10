// Em app/dashboard/layout.tsx

"use client"

import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DashboardSidebarContent } from "@/components/dashboard-sidebar-content"

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
    const authStatus = localStorage.getItem("isAuthenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    } else {
      router.push("/auth/login")
    }
  }, [router])

  if (isAuthenticated === null) {
    return <div className="flex h-screen w-full items-center justify-center">Carregando sistema...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <DashboardSidebarContent />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <DashboardHeader user={FAKE_USER} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
