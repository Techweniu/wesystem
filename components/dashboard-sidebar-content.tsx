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

export function DashboardSidebarContent() {
  const pathname = usePathname();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const supabase = createClient();
    const fetchClients = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name", { ascending: true });
      
      if (error) {
        console.error("Erro ao buscar clientes para o menu:", error);
        setClients([]);
      } else {
        setClients(data || []);
      }
      setIsLoading(false);
    };

    fetchClients();
  }, []);

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
          <Link href="/dashboard">
            <SidebarMenuButton isActive={pathname === "/dashboard"} tooltip="Dashboard">
              <LayoutDashboard />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>

        <Collapsible asChild>
          <SidebarMenuItem>
            <div className="flex w-full items-center justify-between">
              <Link href="/dashboard/clients" className="flex-1">
                <SidebarMenuButton
                  isActive={pathname.startsWith("/dashboard/clients")}
                  tooltip="Clientes"
                >
                  <Users />
                  <span>Clientes</span>
                </SidebarMenuButton>
              </Link>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group size-8 shrink-0"
                  disabled={isLoading}
                >
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
                      <Link href={`/dashboard/clients/${client.id}`} asChild>
                        <SidebarMenuSubButton
                          isActive={pathname === `/dashboard/clients/${client.id}`}
                        >
                          {client.name}
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  ))
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

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
        
        <SidebarMenuItem>
          <Link href="/dashboard/org-chart">
            <SidebarMenuButton isActive={pathname === "/dashboard/org-chart"} tooltip="Organograma">
              <Network />
              <span>Organograma</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <Link href="/dashboard/chat">
            <SidebarMenuButton isActive={pathname === "/dashboard/chat"} tooltip="Assistente IA">
              <Sparkles />
              <span>Assistente IA</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>

      </SidebarMenu>
    </>
  );
}
