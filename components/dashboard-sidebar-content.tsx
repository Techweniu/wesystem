"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  UserCircle,
  Network,
  PanelLeft,
  ChevronDown,
  Sparkles,
  KeyRound,
  Target,
} from "lucide-react"
import {
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

type Client = {
  id: string
  name: string
}

// Define os links permitidos para cada role (Conforme seu pedido)
const allowedLinks = {
  admin: [
    "/dashboard",
    "/dashboard/clients",
    "/dashboard/commercial",
    "/dashboard/financial",
    "/dashboard/team",
    "/dashboard/org-chart",
    // "/dashboard/analytics", // Removido conforme sua indicação
    "/dashboard/accesses",
    "/dashboard/chat",
  ],
  limited: [
    "/dashboard/clients", 
    "/dashboard/org-chart", 
    "/dashboard/accesses", 
    "/dashboard/chat"
  ],
}

interface DashboardSidebarContentProps {
  userRole: "admin" | "limited" | null // Recebe a role
}

export function DashboardSidebarContent({ userRole }: DashboardSidebarContentProps) {
  const pathname = usePathname()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toggleSidebar } = useSidebar()

  useEffect(() => {
    const supabase = createClient()
    const fetchClients = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.from("clients").select("id, name").order("name", { ascending: true })

      if (error) {
        console.error("Erro ao buscar clientes para o menu:", error)
        setClients([])
      } else {
        setClients(data || [])
      }
      setIsLoading(false)
    }

    fetchClients()
  }, [])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clientes", href: "/dashboard/clients", icon: Users, collapsible: true },
    { name: "Comercial", href: "/dashboard/commercial", icon: Target },
    { name: "Financeiro", href: "/dashboard/financial", icon: DollarSign },
    { name: "Equipe", href: "/dashboard/team", icon: UserCircle },
    { name: "Organograma", href: "/dashboard/org-chart", icon: Network },
    { name: "Acessos", href: "/dashboard/accesses", icon: KeyRound },
    { name: "Assistente IA", href: "/dashboard/chat", icon: Sparkles },
    // { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 }, // Removido
  ]

  // Filtra os links visíveis
  const visibleLinks = navigation.filter(
    (link) => userRole && allowedLinks[userRole] && allowedLinks[userRole].includes(link.href)
  );

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={toggleSidebar}>
            <PanelLeft />
            <span>Menu lateral</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarSeparator className="my-1" />

        {visibleLinks.map((item) => (
          // Lógica especial para o item "Clientes"
          item.collapsible ? (
            <Collapsible key={item.name}>
              <SidebarMenuItem>
                <div className="flex w-full items-center justify-between">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.name}
                    className="flex-1"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="group size-8 shrink-0" disabled={isLoading}>
                      <ChevronDown className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {isLoading ? (
                      <>
                        <SidebarMenuSkeleton />
                        <SidebarMenuSkeleton />
                      </>
                    ) : (
                      clients.map((client) => (
                        <SidebarMenuSubItem key={client.id}>
                          <SidebarMenuSubButton asChild isActive={pathname === `/dashboard/clients/${client.id}`}>
                            <Link href={`/dashboard/clients/${client.id}`}>{client.name}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            // Lógica para links normais
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                // Correção: usar startsWith para todas as rotas
                isActive={pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard")}
                tooltip={item.name}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        ))}
      </SidebarMenu>
    </>
  )
}
