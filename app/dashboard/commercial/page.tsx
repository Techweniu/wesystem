import { createAdminClient } from "@/lib/supabase/server" // Admin Client
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, TrendingUp, Users, DollarSign, BarChart3, AlertCircle } from "lucide-react"
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

  // --- CÁLCULO AUTOMÁTICO DE MÉTRICAS REAIS (LIVE) ---
  
  // Calcular Clientes Ativos
  const { count: activeClientsCount } = await supabase
    .from("clients")
    .select("*", { count: 'exact', head: true })
    .eq("status", "active")

  // Calcular MRR (Soma de contratos ativos)
  const { data: activeContracts } = await supabase
    .from("contracts")
    .select("valor_mensal")
    .eq("status", "active")

  const currentMrr = activeContracts?.reduce((acc, contract) => acc + (Number(contract.valor_mensal) || 0), 0) || 0

  // 4. Injetar valores reais nas metas
  const goals = goalsData?.map(goal => {
    if (goal.type === 'revenue') {
      return { ...goal, current_value: currentMrr }
    }
    if (goal.type === 'clients') {
      return { ...goal, current_value: activeClientsCount || 0 }
    }
    return goal
  }) || []

  // 5. Calcular Métricas do Funil
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
      </Tabs>
    </div>
  )
}
