import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NpsQuadrantChart } from "@/components/nps-quadrant-chart"
import { TeamAllocationChart } from "@/components/team-allocation-chart"
import { ProfitabilityChart } from "@/components/profitability-chart"
import { NpsScoreSummaryTable } from "@/components/nps-score-summary-table"
import { BarChart3, TrendingUp, Users, AlertTriangle } from "lucide-react"
import { parseISO, isPast, format } from "date-fns"

export const dynamic = "force-dynamic"

// Função auxiliar para verificar vigência do contrato
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

  // 1. Buscar TODOS os Clientes (com contratos e NPS)
  // Removemos o filtro .eq("status", "active") do banco para filtrar no código e garantir dados
  const { data: clientsData, error } = await supabase
    .from("clients")
    .select(`
      id, 
      name, 
      status,
      contracts ( valor_mensal, status, start_date, end_date ),
      nps_responses ( score, response_date ),
      assigned_assessor_id,
      assigned_videomaker_id,
      assigned_relationship_manager_id,
      assigned_editor_id
    `)
    .order("name")

  if (error) {
    console.error("Erro ao buscar dados de analytics:", error)
  }

  // Filtrar clientes válidos (Ativos ou Prospects com dados)
  const clients = clientsData?.filter(c => c.status === 'active' || c.status === 'prospect') || []

  // 2. Buscar Funcionários e Salários
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, role, salary, status")
    .eq("status", "active")

  // Inicializa estruturas de retorno vazias
  if (!clients || !employees) return { 
    clients: [], 
    employees: [], 
    profitabilityData: [], 
    npsData: [], 
    npsSummary: { detractors: 0, passives: 0, promoters: 0 },
    rankedClients: [],
    employeeLoad: {} 
  }

  // --- PROCESSAMENTO DE DADOS ---

  // A. Mapa de Carga por Funcionário
  const employeeLoad: Record<string, number> = {}
  
  clients.forEach(client => {
    // Só conta carga se o cliente estiver ativo
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

  // B. Cálculo de Lucratividade
  const profitabilityData = clients.map(client => {
    const revenue = client.contracts
      ?.filter(c => c.status === 'active' && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0

    let cost = 0
    const assignedIds = [
      client.assigned_assessor_id,
      client.assigned_videomaker_id,
      client.assigned_relationship_manager_id,
      client.assigned_editor_id
    ].filter(Boolean) as string[]

    assignedIds.forEach(empId => {
      const emp = employees.find(e => e.id === empId)
      // Carga mínima de 1 para evitar divisão por zero
      const load = employeeLoad[empId] || 1
      if (emp && emp.salary) {
        cost += (emp.salary / load)
      }
    })

    return {
      name: client.name,
      revenue,
      cost,
      profit: revenue - cost,
      margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
    }
  }).sort((a, b) => a.profit - b.profit)

  // C. Preparar dados NPS e Resumo
  const npsSummary = { detractors: 0, passives: 0, promoters: 0 }
  
  const clientsWithNps = clients.map(client => {
    const activeContractValue = client.contracts
      ?.filter(c => c.status === 'active' && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0
      
    // Ordenação robusta de datas em JavaScript
    const responses = client.nps_responses || []
    const latestResponse = responses.sort((a, b) => 
      new Date(b.response_date).getTime() - new Date(a.response_date).getTime()
    )[0]

    const latestNps = latestResponse?.score

    // Calcula resumo (apenas se houver nota válida)
    if (typeof latestNps === 'number') {
      if (latestNps <= 7) npsSummary.detractors++
      else if (latestNps === 8) npsSummary.passives++
      else npsSummary.promoters++
    }

    return {
      id: client.id,
      name: client.name,
      latestNps,
      revenue: activeContractValue,
    }
  })

  // D. Dados para o Gráfico de Quadrantes
  // Filtra clientes que têm NPS (Nota pode ser 0, então checamos typeof)
  const npsChartData = clientsWithNps
    .filter(d => typeof d.latestNps === 'number')
    .map(d => ({ 
      name: d.name, 
      nps: d.latestNps as number, 
      revenue: d.revenue 
    }))

  // E. Lista de Ranqueamento (Piores notas primeiro)
  const rankedClients = clientsWithNps
    .filter(c => typeof c.latestNps === 'number')
    .sort((a, b) => (a.latestNps as number) - (b.latestNps as number))

  return {
    clients,
    employees,
    profitabilityData,
    npsData: npsChartData,
    npsSummary,
    rankedClients,
    employeeLoad
  }
}

export default async function AnalyticsPage() {
  const { 
    profitabilityData, 
    npsData, 
    employees, 
    employeeLoad,
    npsSummary,
    rankedClients
  } = await getAnalyticsData()

  // Resumo Rápido
  const totalRevenue = profitabilityData.reduce((acc, curr) => acc + curr.revenue, 0)
  const totalCost = profitabilityData.reduce((acc, curr) => acc + curr.cost, 0)
  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
  const clientsInLoss = profitabilityData.filter(c => c.profit < 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Inteligência de dados e análise de performance.</p>
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
            <p className="text-xs text-muted-foreground">Baseado em custos diretos de equipe</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes em Prejuízo (Est.)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{clientsInLoss}</div>
            <p className="text-xs text-muted-foreground">Receita menor que o custo de equipe rateado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo de Equipe Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalCost)}
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
               {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Quadrantes NPS */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Matriz de Valor x Satisfação</CardTitle>
            <CardDescription>
              Identifique clientes de alto valor em risco (NPS baixo e MRR alto).
            </CardDescription>
          </CardHeader>
          <CardContent>
             {npsData.length > 0 ? (
               <NpsQuadrantChart data={npsData} />
             ) : (
               <div className="flex h-[300px] items-center justify-center text-muted-foreground border border-dashed rounded-lg text-center p-4">
                 <p className="text-sm">
                   Aguardando dados de NPS.<br/>
                   <span className="text-xs">Certifique-se de que os clientes têm avaliações de NPS registradas.</span>
                 </p>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Gráfico de Lucratividade */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Receita vs. Custo (Top Clientes)</CardTitle>
            <CardDescription>
              Análise financeira dos principais clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitabilityChart data={profitabilityData.slice(-10)} /> 
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alocação de Equipe */}
        <TeamAllocationChart 
          data={employees.map(e => ({
            name: e.name,
            role: e.role,
            clients: employeeLoad[e.id] || 0
          }))} 
        />

        {/* Tabela Resumo NPS */}
        <NpsScoreSummaryTable data={npsSummary} rankedClients={rankedClients} />
      </div>
    </div>
  )
}
