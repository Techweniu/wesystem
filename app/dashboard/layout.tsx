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

const FAKE_USER = {
  id: "master-user",
  email: "admin@wesystem.io",
}

type UserRole = "admin" | "limited" | null

export const RoleContext = createContext<UserRole>(null)
export const useRole = () => useContext(RoleContext)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const role = localStorage.getItem("userRole") as UserRole

    if (role !== "admin" && role !== "limited") {
      router.push("/auth/login")
      return
    }

    if (role === "limited") {
      const allowedPaths = [
        "/dashboard/clients",
        "/dashboard/org-chart",
        "/dashboard/accesses"
      ]
      const isAllowed = allowedPaths.some(path => pathname.startsWith(path))
      if (!isAllowed) {
        router.push("/dashboard/accesses")
        return
      }
    }

    setUserRole(role)
  }, [router, pathname])

  if (userRole === null) {
    return <div className="flex h-screen w-full items-center justify-center">Carregando sistema...</div>
  }

  return (
    <RoleContext.Provider value={userRole}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarContent>
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
