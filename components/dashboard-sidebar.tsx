"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, DollarSign, UserCircle, BarChart3, Network } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Clientes",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    name: "Financeiro",
    href: "/dashboard/financial",
    icon: DollarSign,
  },
  {
    name: "Equipe",
    href: "/dashboard/team",
    icon: UserCircle,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Organograma",
    href: "/dashboard/org-chart",
    icon: Network,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-bold">Wesystem</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
