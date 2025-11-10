// bi-dashboard (4)/app/dashboard/layout.tsx
"use client"

import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useEffect, useState } from "react"
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Volta a verificar o 'isAuthenticated'
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

  // SidebarProvider wraps the entire layout structure
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>
          {/* DashboardSidebarContent (agora sem props) */}
          <DashboardSidebarContent />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset> {/* Container for Header and Main */}
        <DashboardHeader user={FAKE_USER} />
        <main className={cn(
          "flex-1 overflow-y-auto p-6", // Existing classes
          "overflow-x-hidden" // Prevents main content from scrolling horizontally
        )}>
          {children} {/* Page content */}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
