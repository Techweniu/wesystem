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

async function getDashboardData() {
  const supabase = await createClient()

  // 1. Buscar Clientes (filtramos 'active' no banco, mas trazemos contratos e NPS)
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
    .eq("status", "active")
    .order("name")

  if (error) {
    console.error("Erro ao buscar dados do dashboard:", error)
  }

  const clients = clientsData || []

  // 2. Buscar Funcionários e Salários
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, role, salary, status")
    .eq("status", "active")

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

  // B. Cálculo de Lucratividade (Receita vs Custo Rateado)
  const profitabilityData = clients.map(client => {
    // Calcula Receita (apenas contratos ativos e vigentes)
    const revenue = client.contracts
      ?.filter(c => c.status === 'active' && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0

    // Calcula Custo (Rateio de Salários)
    let cost = 0
    const assignedIds = [
      client.assigned_assessor_id,
      client.assigned_videomaker_id,
      client.assigned_relationship_manager_id,
      client.assigned_editor_id
    ].filter(Boolean) as string[]

    assignedIds.forEach(empId => {
      const emp = employees?.find(e => e.id === empId)
      // Carga mínima de 1 para segurança matemática
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
  }).sort((a, b) => a.profit - b.profit) // Ordena por lucro (menor -> maior)

  // C. Preparar dados NPS e Resumo
  const npsSummary = { detractors: 0, passives: 0, promoters: 0 }
  
  const clientsWithNps = clients.map(client => {
    // MRR (Mesmo cálculo de cima)
    const activeContractValue = client.contracts
      ?.filter(c => c.status === 'active' && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0
      
    // Encontrar NPS mais recente (Ordenação via JS para garantir precisão)
    const responses = client.nps_responses || []
    const latestResponse = responses.sort((a, b) => 
      new Date(b.response_date).getTime() - new Date(a.response_date).getTime()
    )[0]

    const latestNps = latestResponse?.score

    // Popular resumo
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
      z: 10 // Tamanho da bolha
    }
  })

  // D. Dados para Matriz (Quadrantes)
  // IMPORTANTE: Removemos filtros de receita > 0 para que todos com NPS apareçam
  const npsData = clientsWithNps
    .filter(d => typeof d.latestNps === 'number')
    .map(d => ({
      name: d.name,
      x: d.latestNps as number, // Eixo X: NPS
      y: d.revenue,             // Eixo Y: Receita
      z: d.z
    }))

  // E. Lista Ranqueada (Piores primeiro)
  const rankedClients = clientsWithNps
    .filter(c => typeof c.latestNps === 'number')
    .sort((a, b) => (a.latestNps as number) - (b.latestNps as number))

  return {
    employees: employees || [],
    profitabilityData,
    npsData,
    npsSummary,
    rankedClients,
    employeeLoad
  }
}

export default async function DashboardPage() {
  const { 
    profitabilityData, 
    npsData, 
    employees, 
    employeeLoad,
    npsSummary,
    rankedClients
  } = await getDashboardData()

  // Resumo Rápido (KPIs)
  const totalRevenue = profitabilityData.reduce((acc, curr) => acc + curr.revenue, 0)
  const totalCost = profitabilityData.reduce((acc, curr) => acc + curr.cost, 0)
  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
  const clientsInLoss = profitabilityData.filter(c => c.profit < 0).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral de performance e saúde da agência.</p>
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
            <p className="text-xs text-muted-foreground">Baseado em custos de equipe</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes em Prejuízo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{clientsInLoss}</div>
            <p className="text-xs text-muted-foreground">Receita menor que o custo rateado</p>
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
            <CardTitle className="text-sm font-medium">Receita Recorrente (MRR)</CardTitle>
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
              Eixo Y: Receita | Eixo X: Nota NPS
            </CardDescription>
          </CardHeader>
          <CardContent>
             {npsData.length > 0 ? (
               <NpsQuadrantChart data={npsData} />
             ) : (
               <div className="flex h-[300px] items-center justify-center text-muted-foreground border border-dashed rounded-lg text-center p-4">
                 <p className="text-sm">
                   Sem dados para a matriz.<br/>
                   <span className="text-xs">Cadastre avaliações de NPS nos clientes ativos.</span>
                 </p>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Gráfico de Lucratividade */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Clientes (Receita vs Custo)</CardTitle>
            <CardDescription>
              Comparativo dos maiores contratos ativos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Exibe os top 10 clientes (pode-se ajustar a ordenação se quiser os maiores lucros ou maiores receitas) */}
            <ProfitabilityChart data={profitabilityData.slice(-10)} /> 
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alocação de Equipe */}
        <Card>
          <CardHeader>
            <CardTitle>Alocação da Equipe</CardTitle>
            <CardDescription>Clientes ativos por colaborador.</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamAllocationChart 
              data={employees.map(e => ({
                name: e.name,
                role: e.role,
                clients: employeeLoad[e.id] || 0
              }))} 
            />
          </CardContent>
        </Card>

        {/* Tabela Resumo NPS */}
        <NpsScoreSummaryTable data={npsSummary} rankedClients={rankedClients} />
      </div>
    </div>
  )
}
