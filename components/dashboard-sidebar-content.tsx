"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  UserCircle,
  Network,
  PanelLeft,
  ChevronDown,
  Sparkles,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

type Client = {
  id: string;
  name: string;
};

// O componente agora recebe o papel do usuário
export function DashboardSidebarContent({ userRole }: { userRole: string | null }) {
  const pathname = usePathname();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleSidebar } = useSidebar();

  const isAdmin = userRole === 'admin'; // Variável para facilitar a verificação

  useEffect(() => {
    // ... (código para buscar clientes não muda)
  }, []);

  return (
    <>
      <SidebarMenu>
        {/* ... (código do cabeçalho do menu não muda) ... */}
        
        {/* Renderiza o Dashboard apenas para admin */}
        {isAdmin && (
          <SidebarMenuItem>
            <Link href="/dashboard">
              <SidebarMenuButton isActive={pathname === "/dashboard"} tooltip="Dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        )}

        {/* Clientes é visível para todos */}
        <Collapsible asChild>
          {/* ... (código do menu de clientes não muda) ... */}
        </Collapsible>
        
        {/* Renderiza as seções protegidas apenas para admin */}
        {isAdmin && (
          <>
            <SidebarMenuItem>
              <Link href="/dashboard/financial">
                <SidebarMenuButton isActive={pathname === "/dashboard/financial"} tooltip="Financeiro">
                  <DollarSign />
                  <span>Financeiro</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/dashboard/team">
                <SidebarMenuButton isActive={pathname === "/dashboard/team"} tooltip="Equipe">
                  <UserCircle />
                  <span>Equipe</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </>
        )}
        
        {/* Organograma é visível para todos */}
        <SidebarMenuItem>
          <Link href="/dashboard/org-chart">
            <SidebarMenuButton isActive={pathname === "/dashboard/org-chart"} tooltip="Organograma">
              <Network />
              <span>Organograma</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>

        {/* Assistente IA é visível apenas para admin */}
        {isAdmin && (
          <SidebarMenuItem>
            <Link href="/dashboard/chat">
              <SidebarMenuButton isActive={pathname === "/dashboard/chat"} tooltip="Assistente IA">
                <Sparkles />
                <span>Assistente IA</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        )}

      </SidebarMenu>
    </>
  );
}
