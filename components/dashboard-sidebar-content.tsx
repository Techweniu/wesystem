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

export function DashboardSidebarContent() {
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

        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Dashboard">
            <Link href="/dashboard">
              <LayoutDashboard />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <Collapsible>
          <SidebarMenuItem>
            <div className="flex w-full items-center justify-between">
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/dashboard/clients")}
                tooltip="Clientes"
                className="flex-1"
              >
                <Link href="/dashboard/clients">
                  <Users />
                  <span>Clientes</span>
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

        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/dashboard/financial"} tooltip="Financeiro">
            <Link href="/dashboard/financial">
              <DollarSign />
              <span>Financeiro</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/dashboard/commercial"} tooltip="Comercial">
            <Link href="/dashboard/commercial">
              <Target />
              <span>Comercial</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/dashboard/team"} tooltip="Equipe">
            <Link href="/dashboard/team">
              <UserCircle />
              <span>Equipe</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/dashboard/org-chart"} tooltip="Organograma">
            <Link href="/dashboard/org-chart">
              <Network />
              <span>Organograma</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/accesses")} tooltip="Acessos">
            <Link href="/dashboard/accesses">
              <KeyRound />
              <span>Acessos</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/dashboard/chat"} tooltip="Assistente IA">
            <Link href="/dashboard/chat">
              <Sparkles />
              <span>Assistente IA</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
