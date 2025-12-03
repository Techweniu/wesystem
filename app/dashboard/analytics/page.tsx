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

  // 1. Buscar Clientes com Contratos e NPS
  const { data: clients } = await supabase
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

  // 2. Buscar Funcionários e Salários
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, role, salary, status")
    .eq("status", "active")

  if (!clients || !employees) return { clients: [], employees: [], profitabilityData: [] }

  // --- PROCESSAMENTO DE DADOS ---

  // A. Mapa de Custo por Funcionário (Rateio)
  // Calcula quantos clientes cada funcionário atende para dividir o salário
  const employeeLoad: Record<string, number> = {}
  
  // Conta quantos clientes cada um tem
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

  // B. Cálculo de Lucratividade por Cliente
  const profitabilityData = clients.map(client => {
    // 1. Receita (Soma de contratos ativos)
    const revenue = client.contracts
      ?.filter(c => c.status === 'active')
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0

    // 2. Custo (Soma do rateio dos funcionários atribuídos)
    let cost = 0
    const assignedIds = [
      client.assigned_assessor_id,
      client.assigned_videomaker_id,
      client.assigned_relationship_manager_id,
      client.assigned_editor_id
    ].filter(Boolean) as string[]

    assignedIds.forEach(empId => {
      const emp = employees.find(e => e.id === empId)
      const load = employeeLoad[empId] || 1 // Evita divisão por zero
      if (emp && emp.salary) {
        cost += (emp.salary / load) // Rateio simples
      }
    })

    // Adiciona uma margem de custo operacional fixo (ex: 20% da receita ou valor fixo)
    // Aqui assumiremos apenas custo de equipe para ser exato com os dados que temos.
    
    return {
      name: client.name,
      revenue,
      cost,
      profit: revenue - cost,
      margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
    }
  }).sort((a, b) => a.profit - b.profit) // Ordena do menor lucro (ou prejuízo) para o maior

  // C. Preparar dados para NPS Quadrant
  const npsData = clients.map(client => {
    const activeContractValue = client.contracts
      ?.filter(c => c.status === 'active')
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0
      
    // Pega o NPS mais recente
    const latestNps = client.nps_responses?.sort((a, b) => 
      new Date(b.response_date).getTime() - new Date(a.response_date).getTime()
    )[0]?.score

    return {
      name: client.name,
      x: latestNps || 0, // Nota NPS
      y: activeContractValue, // Valor MRR
      z: 10 // Tamanho da bolha fixo ou baseado em tempo de casa
    }
  }).filter(d => d.x > 0 && d.y > 0) // Remove quem não tem NPS ou Receita

  return {
    clients,
    employees,
    profitabilityData,
    npsData,
    employeeLoad // Para o gráfico de alocação
  }
}

export default async function AnalyticsPage() {
  const { profitabilityData, npsData, employees, employeeLoad } = await getAnalyticsData()

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
             <NpsQuadrantChart data={npsData} />
          </CardContent>
        </Card>

        {/* Gráfico de Lucratividade */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Lucratividade vs. Custo</CardTitle>
            <CardDescription>
              Análise de Receita (Verde) vs Custo de Equipe Rateado (Preto).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitabilityChart data={profitabilityData.slice(-10)} /> {/* Mostra os top 10 ou últimos */}
          </CardContent>
        </Card>
      </div>

      {/* Alocação de Equipe */}
      <Card>
        <CardHeader>
          <CardTitle>Alocação de Equipe</CardTitle>
          <CardDescription>Quantidade de clientes ativos por colaborador.</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamAllocationChart 
            data={employees.map(e => ({
              name: e.name,
              role: e.role,
              clients: employeeLoad[e.id] || 0
            })).sort((a,b) => b.clients - a.clients)} 
          />
        </CardContent>
      </Card>

      {/* Tabela Resumo NPS */}
      <Card>
        <CardHeader>
           <CardTitle>Resumo de Avaliações NPS</CardTitle>
        </CardHeader>
        <CardContent>
           <NpsScoreSummaryTable npsData={npsData} />
        </CardContent>
      </Card>
    </div>
  )
}
