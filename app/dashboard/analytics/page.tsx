import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NpsQuadrantChart } from "@/components/nps-quadrant-chart"
import { TeamAllocationChart } from "@/components/team-allocation-chart"
import { ProfitabilityChart } from "@/components/profitability-chart"
import { NpsScoreSummaryTable } from "@/components/nps-score-summary-table"
import { BarChart3, TrendingUp, Users, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

async function getAnalyticsData() {
  const supabase = await createClient()

  // 1. Buscar Clientes ATIVOS com Contratos e NPS
  // Nota: Clientes inativos ou prospects não entram no Analytics
  const { data: clients, error } = await supabase
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
    .eq("status", "active")

  if (error) {
    console.error("Erro ao buscar dados de analytics:", error)
  }

  // 2. Buscar Funcionários e Salários
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, role, salary, status")
    .eq("status", "active")

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
      ?.filter(c => c.status === 'active')
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

  // C. Preparar dados NPS
  const npsSummary = { detractors: 0, passives: 0, promoters: 0 }
  
  const clientsWithNps = clients.map(client => {
    // Calcula receita recorrente (MRR)
    const activeContractValue = client.contracts
      ?.filter(c => c.status === 'active')
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0
      
    // Pega o NPS mais recente
    // Garante que nps_responses não seja nulo e ordena
    const responses = client.nps_responses || []
    const latestResponse = responses.sort((a, b) => 
      new Date(b.response_date).getTime() - new Date(a.response_date).getTime()
    )[0]

    const latestNps = latestResponse?.score

    // Calcula resumo (apenas se houver nota)
    if (latestNps !== undefined && latestNps !== null) {
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

  // D. Dados para o Gráfico de Quadrantes (Matriz Valor x Satisfação)
  // Filtra clientes que têm NPS E Receita > 0
  const npsChartData = clientsWithNps
    .filter(d => d.latestNps !== undefined && d.latestNps !== null && d.revenue > 0)
    .map(d => ({ 
      name: d.name, 
      nps: d.latestNps as number, // Mapeia para 'nps' como o componente espera
      revenue: d.revenue          // Mapeia para 'revenue' como o componente espera
    }))

  // E. Dados para Lista de Ranqueamento (apenas quem tem NPS)
  const rankedClients = clientsWithNps
    .filter(c => c.latestNps !== undefined && c.latestNps !== null)
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
                   Insuficiente dados para gerar a matriz.<br/>
                   Necessário ter clientes com <strong>NPS respondido</strong> e <strong>Contrato Ativo (Valor &gt; 0)</strong>.
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
            {/* Mostra os top 10 ou últimos, invertendo para mostrar maiores receitas primeiro se preferir */}
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
