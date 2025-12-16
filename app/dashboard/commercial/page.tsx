import { createAdminClient } from "@/lib/supabase/server" // Admin Client
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button" // Adicionado
import { Target, TrendingUp, Users, DollarSign, BarChart3, AlertCircle, ExternalLink } from "lucide-react" // Adicionado ExternalLink
import { AddCommercialGoalForm } from "@/components/add-commercial-goal-form"
import { CommercialGoalCard } from "@/components/commercial-goal-card"
import { ClientCommercialCard } from "@/components/client-commercial-card"
import { cookies } from "next/headers"

// CONFIGURAÇÃO DE CACHE:
export const dynamic = "force-dynamic"
export const revalidate = 0

async function getCommercialData() {
  const supabase = createAdminClient()

  // 1. Buscar Metas
  const { data: goalsData } = await supabase
    .from("commercial_goals")
    .select("*")
    .order("deadline", { ascending: true })

  // 2. Buscar Upsells (Funil)
  const { data: upsells } = await supabase
    .from("client_upsells")
    .select(`
      *,
      clients ( id, name )
    `)
    .order("created_at", { ascending: false })

  // --- CÁLCULO LIVE DAS MÉTRICAS ---
  
  // A. Clientes (Ativos e Inativos para Churn)
  const { count: activeClientsCount } = await supabase
    .from("clients")
    .select("*", { count: 'exact', head: true })
    .eq("status", "active")

  const { count: inactiveClientsCount } = await supabase
    .from("clients")
    .select("*", { count: 'exact', head: true })
    .eq("status", "inactive")

  // B. MRR
  const { data: activeContracts } = await supabase
    .from("contracts")
    .select("valor_mensal")
    .eq("status", "active")
  const currentMrr = activeContracts?.reduce((acc, contract) => acc + (Number(contract.valor_mensal) || 0), 0) || 0

  // C. Upsell Value (Closed)
  const { data: closedUpsells } = await supabase
    .from("client_upsells")
    .select("estimated_value")
    .eq("status", "closed")
  const currentUpsellValue = closedUpsells?.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0) || 0

  // D. Churn Rate
  const totalClients = (activeClientsCount || 0) + (inactiveClientsCount || 0)
  const currentChurnRate = totalClients > 0 
    ? ((inactiveClientsCount || 0) / totalClients) * 100 
    : 0

  // 4. Injetar valores reais nas metas para visualização
  const goals = goalsData?.map(goal => {
    let liveValue = goal.current_value // Fallback

    if (goal.type === 'revenue') liveValue = currentMrr
    else if (goal.type === 'clients') liveValue = activeClientsCount || 0
    else if (goal.type === 'upsell_value') liveValue = currentUpsellValue
    else if (goal.type === 'churn_rate') liveValue = currentChurnRate
    
    return { ...goal, current_value: liveValue }
  }) || []

  // 5. Calcular Stats do Funil
  const funnelStats = {
    identified: upsells?.filter((u) => u.status === "identified").length || 0,
    negotiating: upsells?.filter((u) => u.status === "negotiating").length || 0,
    closed: upsells?.filter((u) => u.status === "closed").length || 0,
    lost: upsells?.filter((u) => u.status === "lost").length || 0,
  }

  return {
    goals: goals,
    upsells: upsells || [],
    funnelStats,
  }
}

export default async function CommercialPage() {
  const data = await getCommercialData()
  
  const userRole = cookies().get("user_role")?.value
  const isAdmin = userRole === "admin"

  // URL do Dashboard (Removendo /embed/ para o link externo funcionar melhor na interface completa)
  const dashboardUrl = "https://lookerstudio.google.com/reporting/b261c2e6-5a13-4f31-9685-b3d78a368efa/page/p_8t7nuoz9xd"
  const dashboardEmbedUrl = "https://lookerstudio.google.com/embed/reporting/b261c2e6-5a13-4f31-9685-b3d78a368efa/page/p_8t7nuoz9xd"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comercial</h1>
          <p className="text-muted-foreground">Gestão de metas e oportunidades de vendas.</p>
        </div>
        {isAdmin && <AddCommercialGoalForm />}
      </div>

      {/* Resumo do Funil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identificado</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.funnelStats.identified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.funnelStats.negotiating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fechado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.funnelStats.closed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdido</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.funnelStats.lost}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="goals">Metas Ativas</TabsTrigger>
          <TabsTrigger value="funnel">Funil de Upsell</TabsTrigger>
          <TabsTrigger value="analytics" className="hidden sm:inline-flex">Dashboard CRM</TabsTrigger>
          <TabsTrigger value="analytics" className="sm:hidden">Dash</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          {data.goals.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.goals.map((goal) => (
                <CommercialGoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Target className="h-10 w-10 mb-4 opacity-20" />
                <p>Nenhuma meta comercial definida.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades de Upsell</CardTitle>
              <CardDescription>
                Lista consolidada de oportunidades cadastradas nos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.upsells.length > 0 ? (
                <div className="space-y-4">
                  {data.upsells.map((upsell: any) => (
                    <ClientCommercialCard key={upsell.id} upsell={upsell} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma oportunidade encontrada.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOVA ABA: Dashboard CRM */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Analytics & Performance</CardTitle>
                <CardDescription>
                  Visão detalhada de performance via Looker Studio.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Externamente
                </a>
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {/* Container responsivo 16:9 */}
              <div className="w-full aspect-video rounded-md overflow-hidden border bg-muted relative">
                <iframe 
                  src={dashboardEmbedUrl}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
              
              {/* Botão visível apenas em mobile abaixo do gráfico se necessário */}
              <div className="sm:hidden p-4 pt-2">
                 <Button variant="outline" className="w-full" asChild>
                  <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Dashboard Completo
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
