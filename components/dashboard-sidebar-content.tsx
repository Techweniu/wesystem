"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, DollarSign, UserCircle, BarChart3, Network, PanelLeft } from "lucide-react"
import {
  useSidebar, // 1. Importar o hook 'useSidebar'
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator
} from "@/components/ui/sidebar"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/dashboard/clients", icon: Users },
  { name: "Financeiro", href: "/dashboard/financial", icon: DollarSign },
  { name: "Equipe", href: "/dashboard/team", icon: UserCircle },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Organograma", href: "/dashboard/org-chart", icon: Network },
]

export function DashboardSidebarContent() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar() // 2. Obter a função para alternar o menu

  return (
    <>
      <SidebarMenu>
        {/* Item de menu que funciona como o botão de recolher/expandir */}
        <SidebarMenuItem>
          {/* 3. Usar um SidebarMenuButton normal com um onClick */}
          <SidebarMenuButton onClick={toggleSidebar}>
            <PanelLeft />
            <span>Menu lateral</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Separador para organização visual */}
        <SidebarSeparator className="my-1" />

        {/* Itens de navegação normais */}
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <SidebarMenuItem key={item.name}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={isActive} tooltip={item.name}>
                  <item.icon />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </>
  )
}
