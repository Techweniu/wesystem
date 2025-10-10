"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@supabase/supabase-js"
import { LogOut, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardHeaderProps {
  user: Pick<User, 'email'>
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()

  const handleSignOut = () => {
    localStorage.removeItem("isAuthenticated")
    router.push("/auth/login")
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        {/* O SidebarTrigger foi removido daqui */}
        <h2 className="text-lg font-semibold">Bem-vindo ao Dashboard</h2>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Conta de Acesso</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
