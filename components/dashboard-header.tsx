"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-provider"
import { logoutAction } from "@/app/auth/login/actions"

export function DashboardHeader({ user }: { user: any }) {
  const router = useRouter()

  const handleSignOut = async () => {
    localStorage.removeItem("userRole")
    await logoutAction()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        <h2 className="text-lg font-semibold md:text-xl">Visão Geral</h2>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  )
}
