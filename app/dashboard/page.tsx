import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Users, Star } from "lucide-react"
import { AiInsightsPanel } from "@/components/ai-insights-panel"
import { OperationHealthCard } from "@/components/operation-health-card"
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isPast } from "date-fns" // Importações de data

// --- Componentes do Dashboard ATUALIZADOS ---
import { RevenueChart } from "@/components/revenue-chart" // Nosso gráfico atualizado
import { NpsQuadrantChart } from "@/components/nps-quadrant-chart" // Trazido da página de Clientes

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

  // --- 1. Dados para Gráfico de Barras (Últimos 6 Meses) ---
  const months: Date[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1) // Garante que estamos no dia 1
    d.setMonth(d.getMonth() - i)
    months.push(d)
  }

  // Busca de dados que não mudam por mês (funcionários ativos, contratos ativos)
  const { data: activeEmployees } = await supabase.from("employees").select("salary").eq("status", "active")
  const { data: activeContracts } = await supabase.from("contracts").select("valor_mensal, start_date, end_date").eq("status", "active")

  const chartData = await Promise.all(
    months.map(async (monthDate) => {
      const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd")
      const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd")
      const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "short" })

      // --- A. DADOS REALIZADOS (O QUE FOI PAGO/RECEBIDO) ---
      const { data: cPayments } = await supabase.from("client_payments").select("amount").gte("payment_date", startDate).lte("payment_date", endDate)
      const { data: sPayments } = await supabase.from("one_time_services").select("value").gte("received_date", startDate).lte("received_date", endDate)
      const { data: ePayments } = await supabase.from("employee_payments").select("amount").gte("payment_date", startDate).lte("payment_date", endDate)
      const { data: oPayments } = await supabase.from("costs").select("value").gte("paid_date", startDate).lte("paid_date", endDate)

      const receita_realizada =
        (cPayments?.reduce((s, p) => s + Number(p.amount), 0) || 0) +
        (sPayments?.reduce((s, p) => s + Number(p.value), 0) || 0)
      const custo_realizado =
        (ePayments?.reduce((s, p) => s + Number(p.amount), 0) || 0) +
        (oPayments?.reduce((s, p) => s + Number(p.value), 0) || 0)
      const lucro_realizado = receita_realizada - custo_realizado

      // --- B. DADOS ESTIMADOS (O QUE ESTÁ NO PAPEL) ---
      // 1. Receita Estimada (MRR Vigente no Mês + Serviços Pendentes do Mês)
      const mrrDoMes = activeContracts
        ?.filter(c => {
          const cStart = c.start_date ? parseISO(c.start_date) : new Date(1970,0,1);
          const cEnd = c.end_date ? parseISO(c.end_date) : new Date(2100,0,1);
          // Contrato estava vigente se começou antes do fim do mês E terminou depois do início do mês
          return cStart <= endOfMonth(monthDate) && cEnd >= startOfMonth(monthDate);
        })
        .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0
      
      const { data: sPending } = await supabase.from("one_time_services").select("value").eq("status", "pending").gte("date", startDate).lte("date", endDate);
      const servicosPendentesDoMes = sPending?.reduce((s, p) => s + Number(p.value), 0) || 0;
      const receita_estimada = mrrDoMes + servicosPendentesDoMes;

      // 2. Custo Estimado (Salários Ativos + Custos Pendentes do Mês)
      const salariosDoMes = activeEmployees?.reduce((s, e) => s + Number(e.salary), 0) || 0;
      const { data: oPending } = await supabase.from("costs").select("value").eq("status", "pending").gte("date", startDate).lte("date", endDate);
      const custosPendentesDoMes = oPending?.reduce((s, p) => s + Number(p.value), 0) || 0;
      const custo_estimado = salariosDoMes + custosPendentesDoMes;

      return { 
        month: monthLabel, 
        receita: receita_realizada, // Renomeado de 'receita_realizada' para 'receita'
        custos: custo_realizado,   // Renomeado de 'custo_realizado' para 'custos'
        lucro: lucro_realizado,    // Renomeado de 'lucro_realizado' para 'lucro'
        receita_estimada,
        custo_estimado
      };
    }),
  )

  // --- 2. Dados para Cards (Mês Atual) ---
  // Pegamos os dados do último mês calculado para o gráfico
  const currentMonthData = chartData[chartData.length - 1]

  // --- 3. Card Clientes Ativos ---
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

  // --- 4. Dados para Gráfico NPS vs. MRR ---
  const { data: clientsData } = await supabase
    .from("clients")
    .select(`
      name, status,
      contracts (valor_mensal, start_date, end_date, status),
      nps_responses (score, response_date)
    `)
    .eq("status", "active")

  const npsQuadrantData = clientsData
    ?.map(client => {
      // Calcula o MRR atual do cliente
      const mrr = client.contracts
        .filter(c => c.status === 'active' && isContractVigent(c))
        .reduce((sum, c) => sum + Number(c.valor_mensal), 0)
      
      // Pega a nota de NPS mais recente
      const latestNpsScore = client.nps_responses
        ?.sort((a, b) => new Date(b.response_date).getTime() - new Date(a.response_date).getTime())[0]?.score

      return { name: client.name, nps: latestNpsScore, revenue: mrr }
    })
    // Filtra clientes que não têm NPS ou não têm MRR (não apareceriam no gráfico)
    .filter(c => c.nps !== undefined && c.revenue > 0)

  return {
    chartData, // Agora contém todos os 5 campos
    currentMonthRevenue: currentMonthData.receita, // Usando o dado realizado
    currentMonthCosts: currentMonthData.custos,     // Usando o dado realizado
    currentMonthProfit: currentMonthData.lucro,     // Usando o dado realizado
    activeClients: activeClients || 0,
    latestNps: latestNps?.score,
    npsQuadrantData: npsQuadrantData || [],
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do desempenho da agência</p>
        </div>
      </div>

      {/* --- CARDS FINANCEIROS (TOPO) --- */}
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
              }).format(data.currentMonthRevenue)}
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
              }).format(data.currentMonthCosts)}
            </div>
            <p className="text-xs text-muted-foreground">Salários + Outros Custos Pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro (Mês Atual)</CardTitle>
            <TrendingUp className={`h-4 w-4 ${data.currentMonthProfit >= 0 ? "text-chart-2" : "text-destructive"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.currentMonthProfit >= 0 ? "" : "text-destructive"}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.currentMonthProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Receita Real - Custo Real</p>
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

      {/* --- CARDS DE INSIGHTS (MEIO) --- */}
      <div className="grid gap-4 md:grid-cols-2">
        <AiInsightsPanel />
        <OperationHealthCard />
      </div>

      {/* --- GRÁFICOS (ABAIXO) --- */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Passa os dados corretos dos últimos 6 meses (agora com 5 campos) */}
        <RevenueChart data={data.chartData} />
        {/* Passa os dados de NPS vs MRR */}
        <NpsQuadrantChart data={data.npsQuadrantData} />
      </div>
    </div>
  )
}
