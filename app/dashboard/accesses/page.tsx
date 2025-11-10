import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Users, Star } from "lucide-react" // Adicionado Star
import { AiInsightsPanel } from "@/components/ai-insights-panel"
import { OperationHealthCard } from "@/components/operation-health-card"

// --- Importação dos novos componentes ---
import { NpsQuadrantChart } from "@/components/nps-quadrant-chart"
import { NpsScoreSummaryTable } from "@/components/nps-score-summary-table"
import { DashboardTopClientsTable } from "@/components/dashboard-top-clients-table" // Nosso novo componente
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isPast } from "date-fns" // Importações de data

// --- Lógica Auxiliar ---
const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true
  return hasStarted && hasNotEnded
}

// --- NOVA LÓGICA DE DADOS DO DASHBOARD ---
async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date()
  const startDate = format(startOfMonth(today), "yyyy-MM-dd")
  const endDate = format(endOfMonth(today), "yyyy-MM-dd")

  // --- 1. Card Data (Fluxo de Caixa do Mês Atual) ---
  const { data: contractPayments } = await supabase
    .from("client_payments")
    .select("amount")
    .gte("payment_date", startDate)
    .lte("payment_date", endDate)
  
  const { data: servicePayments } = await supabase
    .from("one_time_services")
    .select("value")
    .gte("received_date", startDate)
    .lte("received_date", endDate)
  
  const { data: salaryPayments } = await supabase
    .from("employee_payments")
    .select("amount")
    .gte("payment_date", startDate)
    .lte("payment_date", endDate)
  
  const { data: costPayments } = await supabase
    .from("costs")
    .select("value")
    .gte("paid_date", startDate)
    .lte("paid_date", endDate)

  const totalRevenue =
    (contractPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0) +
    (servicePayments?.reduce((sum, s) => sum + Number(s.value), 0) || 0)
  
  const totalCosts =
    (salaryPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0) +
    (costPayments?.reduce((sum, c) => sum + Number(c.value), 0) || 0)
  
  const profit = totalRevenue - totalCosts

  // --- 2. Active Clients & Latest NPS ---
  const { count: activeClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
  
  const { data: latestNps } = await supabase
    .from("nps_responses")
    .select("score")
    .order("response_date", { ascending: false })
    .limit(1)
    .single()

  // --- 3. Data for Charts & Tables (Lógica mais complexa) ---
  const { data: clientsData } = await supabase
    .from("clients")
    .select(`
      id, name, status,
      contracts (id, valor_mensal, start_date, end_date, status),
      one_time_services (value, status, received_date),
      nps_responses (score, response_date)
    `)
    .eq("status", "active")
  
  const oneYearAgo = format(subMonths(today, 12), "yyyy-MM-dd")

  const clientMetrics = clientsData?.map(client => {
    // MRR Atual
    const mrr = client.contracts
      .filter(c => c.status === 'active' && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0)
    
    // Receita Pontual (últimos 12 meses)
    const oneTimeRevenueLast12M = client.one_time_services
      .filter(s => s.received_date && s.received_date >= oneYearAgo)
      .reduce((sum, s) => sum + Number(s.value), 0)

    // NPS Mais Recente
    const latestNpsScore = client.nps_responses?.sort((a, b) => new Date(b.response_date).getTime() - new Date(a.response_date).getTime())[0]?.score

    return {
      id: client.id,
      name: client.name,
      mrr,
      oneTimeRevenueLast12M,
      totalValue: (mrr * 12) + oneTimeRevenueLast12M, // Valor Anualizado
      latestNps: latestNpsScore
    }
  })

  // Data for NpsQuadrantChart (Receita vs NPS)
  // Usamos o MRR como eixo de Receita. Se MRR for 0, usamos a receita pontual.
  const npsQuadrantData = clientMetrics
    ?.filter(c => c.latestNps !== undefined && (c.mrr > 0 || c.oneTimeRevenueLast12M > 0))
    .map(c => ({ 
      name: c.name, 
      nps: c.latestNps!, 
      revenue: c.mrr > 0 ? c.mrr : c.oneTimeRevenueLast12M // Prioriza MRR
    }))

  // Data for NpsScoreSummaryTable (Detratores/Passivos/Promotores)
  const npsSummaryData = {
    detractors: clientMetrics?.filter(c => c.latestNps !== undefined && c.latestNps <= 7).length || 0, // 0-7
    passives: clientMetrics?.filter(c => c.latestNps !== undefined && c.latestNps === 8).length || 0, // 8
    promoters: clientMetrics?.filter(c => c.latestNps !== undefined && c.latestNps >= 9).length || 0, // 9-10
  }
  const rankedClients = clientMetrics
    ?.filter(c => c.latestNps !== undefined)
    .sort((a, b) => a.latestNps! - b.latestNps!) // Piores primeiro

  // Data for DashboardTopClientsTable (Top 5 por Valor Anualizado)
  const topClients = clientMetrics
    ?.sort((a, b) => b.totalValue - a.totalValue) // Maiores primeiro
    .slice(0, 5)

  return {
    totalRevenue,
    totalCosts,
    profit,
    activeClients: activeClients || 0,
    latestNps: latestNps?.score,
    npsQuadrantData: npsQuadrantData || [],
    npsSummaryData,
    rankedClients: rankedClients || [],
    topClients: topClients || []
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      {/* Componentes Mantidos */}
      <div className="grid gap-4 md:grid-cols-2">
        <AiInsightsPanel />
        <OperationHealthCard />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do desempenho da agência</p>
        </div>
      </div>

      {/* --- CARDS ATUALIZADOS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Mês Atual)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Contratos + Serviços Pontuais Pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos (Mês Atual)</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground">Salários + Outros Custos Pagos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro (Mês Atual)</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.profit)}
            </div>
            <p className="text-xs text-muted-foreground">Receita - Custos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Último NPS: {data.latestNps !== undefined ? `${data.latestNps}/10` : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- GRÁFICOS E TABELA ATUALIZADOS --- */}
      <div className="grid gap-4 md:grid-cols-2">
        <NpsQuadrantChart data={data.npsQuadrantData} />
        <NpsScoreSummaryTable data={data.npsSummaryData} rankedClients={data.rankedClients} />
      </div>

      <DashboardTopClientsTable clients={data.topClients} />
    </div>
  )
}
