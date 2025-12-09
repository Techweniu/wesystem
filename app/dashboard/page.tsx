import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NpsQuadrantChart } from "@/components/nps-quadrant-chart"
import { TeamAllocationChart } from "@/components/team-allocation-chart"
import { ProfitabilityChart } from "@/components/profitability-chart"
import { NpsScoreSummaryTable } from "@/components/nps-score-summary-table"
import { ClientHealthChart } from "@/components/client-health-chart"
import { CommercialFunnelChart } from "@/components/commercial-funnel-chart"
import { AiInsightsPanel } from "@/components/ai-insights-panel"
import { OperationHealthCard } from "@/components/operation-health-card"
import { BarChart3, TrendingUp, Users, AlertTriangle } from "lucide-react"
import { parseISO, isPast, format } from "date-fns"

export const dynamic = "force-dynamic"

// Definição das Regras de Capacidade (Clientes por Profissional)
const CAPACITY_RULES: Record<string, number> = {
  editor: 10,
  videomaker: 15,
  assessor: 15,
  relationship_manager: 20, // Assumindo 20 para Gerentes se houver, ou fallback
}

// Mapeamento de nomes amigáveis
const ROLE_LABELS: Record<string, string> = {
  editor: "Editores",
  videomaker: "Videomakers",
  assessor: "Assessores",
  relationship_manager: "Gerentes de Conta",
}

const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true
  return hasStarted && hasNotEnded
}

async function getDashboardData() {
  const supabase = createAdminClient()

  // 1. Buscar Clientes
  const { data: clientsData, error } = await supabase
    .from("clients")
    .select(`
      id, 
      name, 
      status,
      health_status,
      contracts ( valor_mensal, status, start_date, end_date ),
      nps_responses ( score, response_date ),
      assigned_assessor_id,
      assigned_videomaker_id,
      assigned_relationship_manager_id,
      assigned_editor_id
    `)
    .order("name")

  if (error) {
    console.error("Erro crítico ao buscar dados:", error)
  }

  const clients = clientsData?.filter(c => c.status === 'active' || c.status === 'prospect') || []
  const activeClientsCount = clients.filter(c => c.status === 'active').length

  // 2. Buscar Funcionários
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, role, salary, status")
    .eq("status", "active")

  // 3. Buscar Upsells
  const { data: upsells } = await supabase
    .from("client_upsells")
    .select("status")

  // --- PROCESSAMENTO ---

  // A. Cálculo de Capacidade Operacional
  const employeesByRole: Record<string, number> = {}
  
  // Conta funcionários ativos por cargo
  employees?.forEach(emp => {
    // Normaliza o role para lowercase para garantir match
    const roleKey = emp.role?.toLowerCase().trim() || 'unknown'
    employeesByRole[roleKey] = (employeesByRole[roleKey] || 0) + 1
  })

  // Gera métricas para os cargos críticos definidos
  const capacityMetrics = Object.entries(CAPACITY_RULES).map(([roleKey, capacityPerPerson]) => {
    // Se não tiver ninguém contratado, assume 0
    const totalEmployees = employeesByRole[roleKey] || 0
    
    // Se não houver funcionários, a capacidade é 0
    const maxCapacity = totalEmployees * capacityPerPerson
    
    // Porcentagem de uso (evita divisão por zero)
    let usagePercent = 0
    if (maxCapacity > 0) {
      usagePercent = (activeClientsCount / maxCapacity) * 100
    } else if (activeClientsCount > 0) {
      usagePercent = 1000 // Valor alto para indicar crítico se não tem equipe
    }

    // Lógica de contratação
    const surplusClients = activeClientsCount - maxCapacity
    const hireNeeded = surplusClients > 0 ? Math.ceil(surplusClients / capacityPerPerson) : 0

    let status: "healthy" | "warning" | "critical" = "healthy"
    if (usagePercent > 100 || (totalEmployees === 0 && activeClientsCount > 0)) status = "critical"
    else if (usagePercent > 85) status = "warning"

    return {
      roleName: ROLE_LABELS[roleKey] || roleKey,
      currentLoad: activeClientsCount,
      capacityPerPerson,
      totalEmployees,
      maxCapacity,
      usagePercent,
      status,
      hireNeeded
    }
  }).filter(m => ["Editores", "Videomakers", "Assessores"].includes(m.roleName)) 
  // Filtro opcional: Mostra apenas os cargos mencionados na regra (ou remova o .filter para mostrar todos configurados)

  // B. Outros KPIs (Mantidos do anterior)
  const healthCounts = { green: 0, yellow: 0, red: 0 }
  clients.forEach(c => {
    if (c.status === 'active') {
      if (c.health_status === 'green') healthCounts.green++
      else if (c.health_status === 'yellow') healthCounts.yellow++
      else if (c.health_status === 'red') healthCounts.red++
    }
  })

  const healthData = [
    { status: "Bom", count: healthCounts.green, fill: "hsl(142, 76%, 36%)" },
    { status: "Atenção", count: healthCounts.yellow, fill: "hsl(48, 96%, 53%)" },
    { status: "Crítico", count: healthCounts.red, fill: "hsl(0, 84%, 60%)" },
  ]

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

  const employeeLoad: Record<string, number> = {}
  let totalRevenue = 0
  let totalCost = 0
  let clientsInLoss = 0
  const npsSummary = { detractors: 0, passives: 0, promoters: 0 }
  const clientsWithNpsAndRevenue: any[] = []

  clients.forEach(client => {
    if (client.status === 'active') {
      const roles = [
        client.assigned_assessor_id, client.assigned_videomaker_id,
        client.assigned_relationship_manager_id, client.assigned_editor_id
      ]
      roles.forEach(empId => {
        if (empId) employeeLoad[empId] = (employeeLoad[empId] || 0) + 1
      })
    }

    const responses = client.nps_responses || []
    const latestResponse = responses.sort((a, b) => 
      new Date(b.response_date).getTime() - new Date(a.response_date).getTime()
    )[0]
    const latestNps = latestResponse?.score

    if (typeof latestNps === 'number') {
      if (latestNps <= 7) npsSummary.detractors++
      else if (latestNps === 8) npsSummary.passives++
      else npsSummary.promoters++
    }

    const revenue = client.contracts?.filter(c => c.status === 'active' && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0
    
    totalRevenue += revenue

    let clientCost = 0
    if (employees && client.status === 'active') {
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

    clientsWithNpsAndRevenue.push({
      id: client.id,
      name: client.name,
      latestNps,
      revenue,
      cost: clientCost,
      profit: revenue - clientCost
    })
  })

  const npsData = clientsWithNpsAndRevenue
    .filter(d => typeof d.latestNps === 'number')
    .map(d => ({ name: d.name, nps: d.latestNps, revenue: d.revenue }))

  const profitabilityData = clientsWithNpsAndRevenue
    .sort((a, b) => a.profit - b.profit)
    .slice(-10)

  const rankedClients = clientsWithNpsAndRevenue
    .filter(d => typeof d.latestNps === 'number')
    .sort((a, b) => a.latestNps - b.latestNps)

  return {
    healthData,
    funnelData,
    employees: employees || [],
    employeeLoad,
    npsData,
    profitabilityData,
    npsSummary,
    rankedClients,
    kpis: { totalRevenue, totalCost, clientsInLoss },
    operationMetrics: {
      metrics: capacityMetrics,
      totalActiveClients: activeClientsCount
    }
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const avgMargin = data.kpis.totalRevenue > 0 
    ? ((data.kpis.totalRevenue - data.kpis.totalCost) / data.kpis.totalRevenue) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">Indicadores chave de performance.</p>
        </div>
      </div>

      {/* Linha Topo: Insights e Saúde da Operação (Capacidade) */}
      <div className="grid gap-6 md:grid-cols-2">
        <AiInsightsPanel />
        <OperationHealthCard 
            metrics={data.operationMetrics.metrics} 
            totalActiveClients={data.operationMetrics.totalActiveClients} 
        />
      </div>

      {/* Cards de Resumo KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Operacional</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgMargin < 20 ? "text-yellow-600" : "text-green-600"}`}>
              {avgMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Estimativa baseada em custos diretos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes em Alerta</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.kpis.clientsInLoss}</div>
            <p className="text-xs text-muted-foreground">Clientes com custo maior que receita</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo de Equipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(data.kpis.totalCost)}
            </div>
             <p className="text-xs text-muted-foreground">Mensal estimado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(data.kpis.totalRevenue)}
            </div>
             <p className="text-xs text-muted-foreground">Mensal confirmada</p>
          </CardContent>
        </Card>
      </div>

      {/* Linha 1: Matriz e Rentabilidade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Matriz de Valor x Satisfação</CardTitle>
            <CardDescription>Identifique clientes de alto valor em risco (NPS baixo e MRR alto).</CardDescription>
          </CardHeader>
          <CardContent>
             {data.npsData.length > 0 ? (
               <NpsQuadrantChart data={data.npsData} />
             ) : (
               <div className="flex h-[300px] items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                 <p className="text-sm">Sem dados de NPS.</p>
               </div>
             )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Receita vs. Custo (Top Clientes)</CardTitle>
            <CardDescription>Análise financeira dos principais clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitabilityChart data={data.profitabilityData} /> 
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Saúde e Funil (Novos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientHealthChart data={data.healthData} />
        <CommercialFunnelChart data={data.funnelData} />
      </div>

      {/* Linha 3: Operacional */}
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
