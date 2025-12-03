import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamAllocationChart } from "@/components/team-allocation-chart"
import { NpsScoreSummaryTable } from "@/components/nps-score-summary-table"
import { ClientHealthChart } from "@/components/client-health-chart" // Novo
import { CommercialFunnelChart } from "@/components/commercial-funnel-chart" // Novo
import { BarChart3, TrendingUp, Users, AlertTriangle } from "lucide-react"
import { parseISO, isPast, format } from "date-fns"

export const dynamic = "force-dynamic"

const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true
  return hasStarted && hasNotEnded
}

async function getAnalyticsData() {
  const supabase = await createClient()

  // 1. Buscar TODOS os Clientes (para Saúde e NPS)
  const { data: clientsData } = await supabase
    .from("clients")
    .select(`
      id, name, status, health_status,
      contracts ( valor_mensal, status, start_date, end_date ),
      nps_responses ( score, response_date ),
      assigned_assessor_id,
      assigned_videomaker_id,
      assigned_relationship_manager_id,
      assigned_editor_id
    `)
    .order("name")

  const clients = clientsData?.filter(c => c.status === 'active' || c.status === 'prospect') || []

  // 2. Buscar Dados Comerciais (Upsells) para o Funil
  const { data: upsells } = await supabase
    .from("client_upsells")
    .select("status")

  // 3. Buscar Funcionários
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, role, salary, status")
    .eq("status", "active")

  // --- PROCESSAMENTO ---

  // A. Saúde da Carteira
  const healthCounts = { green: 0, yellow: 0, red: 0 }
  clients.forEach(c => {
    if (c.health_status === 'green') healthCounts.green++
    else if (c.health_status === 'yellow') healthCounts.yellow++
    else if (c.health_status === 'red') healthCounts.red++
  })

  const healthData = [
    { status: "Bom", count: healthCounts.green, fill: "hsl(142, 76%, 36%)" }, // Verde
    { status: "Atenção", count: healthCounts.yellow, fill: "hsl(48, 96%, 53%)" }, // Amarelo
    { status: "Crítico", count: healthCounts.red, fill: "hsl(0, 84%, 60%)" }, // Vermelho
  ]

  // B. Funil Comercial
  const funnelCounts = { identified: 0, negotiating: 0, closed: 0 }
  upsells?.forEach(u => {
    if (u.status === 'identified') funnelCounts.identified++
    if (u.status === 'negotiating') funnelCounts.negotiating++
    if (u.status === 'closed') funnelCounts.closed++
  })

  const funnelData = [
    { stage: "Identificado", count: funnelCounts.identified, fill: "hsl(var(--chart-1))" },
    { stage: "Negociação", count: funnelCounts.negotiating, fill: "hsl(var(--chart-2))" },
    { stage: "Fechado", count: funnelCounts.closed, fill: "hsl(var(--chart-3))" },
  ]

  // C. Carga de Equipe
  const employeeLoad: Record<string, number> = {}
  if (employees) {
    clients.forEach(client => {
      if (client.status !== 'active') return
      const roles = [
        client.assigned_assessor_id,
        client.assigned_videomaker_id,
        client.assigned_relationship_manager_id,
        client.assigned_editor_id
      ]
      roles.forEach(empId => {
        if (empId) employeeLoad[empId] = (employeeLoad[empId] || 0) + 1
      })
    })
  }

  // D. Resumos Financeiros e NPS (Mantidos como KPI)
  let totalRevenue = 0
  let totalCost = 0
  let clientsInLoss = 0
  const npsSummary = { detractors: 0, passives: 0, promoters: 0 }
  const rankedClients: any[] = []

  clients.forEach(client => {
    // NPS
    const latestNps = client.nps_responses?.sort((a, b) => 
      new Date(b.response_date).getTime() - new Date(a.response_date).getTime()
    )[0]?.score

    if (typeof latestNps === 'number') {
      if (latestNps <= 7) npsSummary.detractors++
      else if (latestNps === 8) npsSummary.passives++
      else npsSummary.promoters++
      
      rankedClients.push({ id: client.id, name: client.name, latestNps })
    }

    // Financeiro
    const revenue = client.contracts?.filter(c => c.status === 'active' && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0
    
    totalRevenue += revenue

    // Custo estimado (rateio simples)
    if (employees) {
      let clientCost = 0
      const roles = [
        client.assigned_assessor_id, client.assigned_videomaker_id,
        client.assigned_relationship_manager_id, client.assigned_editor_id
      ].filter(Boolean)
      
      roles.forEach(empId => {
        const emp = employees.find(e => e.id === empId)
        const load = employeeLoad[empId] || 1
        if (emp?.salary) clientCost += (emp.salary / load)
      })
      totalCost += clientCost
      if (revenue > 0 && revenue < clientCost) clientsInLoss++
    }
  })

  // Ordena clientes por NPS (piores primeiro)
  rankedClients.sort((a, b) => a.latestNps - b.latestNps)

  return {
    healthData,
    funnelData,
    employees: employees || [],
    employeeLoad,
    npsSummary,
    rankedClients,
    kpis: { totalRevenue, totalCost, clientsInLoss }
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  const avgMargin = data.kpis.totalRevenue > 0 
    ? ((data.kpis.totalRevenue - data.kpis.totalCost) / data.kpis.totalRevenue) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Visão geral de saúde e performance.</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Operacional Est.</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgMargin < 20 ? "text-yellow-600" : "text-green-600"}`}>
              {avgMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Baseado em custos diretos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes em Prejuízo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.kpis.clientsInLoss}</div>
            <p className="text-xs text-muted-foreground">Receita &lt; Custo Rateado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo de Equipe Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.kpis.totalCost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.kpis.totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novos Gráficos: Saúde e Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientHealthChart data={data.healthData} />
        <CommercialFunnelChart data={data.funnelData} />
      </div>

      {/* Gráficos Secundários: Equipe e NPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamAllocationChart 
          data={data.employees.map(e => ({
            name: e.name,
            role: e.role,
            clients: data.employeeLoad[e.id] || 0
          }))} 
        />
        <NpsScoreSummaryTable data={data.npsSummary} rankedClients={data.rankedClients} />
      </div>
    </div>
  )
}
