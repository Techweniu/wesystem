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

type UserRole = "admin" | "limited" | null

// Lista completa de navegação
const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/dashboard/clients", icon: Users },
  { name: "Financeiro", href: "/dashboard/financial", icon: DollarSign },
  { name: "Comercial", href: "/dashboard/commercial", icon: Target },
  { name: "Equipe", href: "/dashboard/team", icon: UserCircle },
  { name: "Organograma", href: "/dashboard/org-chart", icon: Network },
  { name: "Acessos", href: "/dashboard/accesses", icon: KeyRound },
  { name: "Assistente IA", href: "/dashboard/chat", icon: Sparkles },
]

// --- ALTERAÇÃO AQUI: Lista restrita apenas a Clientes e Organograma ---
const limitedAccessNav = ["Clientes", "Organograma"]
// ----------------------------------------------------------------------

// Recebe 'userRole' como prop
export function DashboardSidebarContent({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toggleSidebar } = useSidebar()

  // Filtra a navegação com base no 'userRole'
  const navigation =
    userRole === "admin"
      ? allNavigation
      : allNavigation.filter((item) => limitedAccessNav.includes(item.name))

  // Verifica se o menu "Clientes" deve ser exibido
  const showClients = navigation.some((item) => item.name === "Clientes")

  useEffect(() => {
    // Só busca os clientes se o menu "Clientes" estiver visível
    if (!showClients) {
      setIsLoading(false)
      return
    }

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
  }, [showClients])

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

        {/* Mapeia a lista de navegação filtrada */}
        {navigation.map((item) => {
          // Lógica especial para o item "Clientes" (Collapsible)
          if (item.name === "Clientes") {
            return (
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
            )
          }

          // Renderização padrão para os outros itens
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </>
  )
}
