import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react"
import { RevenueChart } from "@/components/revenue-chart"
import { NpsChart } from "@/components/nps-chart"
import { TopClientsTable } from "@/components/top-clients-table"

async function getDashboardData() {
  const supabase = await createClient()

  // Get total active contracts revenue
  const { data: contracts } = await supabase.from("contracts").select("monthly_value").eq("status", "active")

  const monthlyRevenue = contracts?.reduce((sum, c) => sum + Number(c.monthly_value), 0) || 0

  // Get one-time services revenue (current month)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const { data: services } = await supabase
    .from("one_time_services")
    .select("value")
    .eq("status", "completed")
    .gte("date", `${currentMonth}-01`)

  const oneTimeRevenue = services?.reduce((sum, s) => sum + Number(s.value), 0) || 0

  // Get total costs (current month)
  const { data: costs } = await supabase.from("costs").select("value").gte("date", `${currentMonth}-01`)

  const totalCosts = costs?.reduce((sum, c) => sum + Number(c.value), 0) || 0

  // Get active clients count
  const { count: activeClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Get average NPS
  const { data: npsData } = await supabase.from("nps_responses").select("score")

  let averageNps = 0
  if (npsData && npsData.length > 0) {
    const totalScore = npsData.reduce((sum, n) => sum + n.score, 0)
    averageNps = Math.round(totalScore / npsData.length)
  }

  const totalRevenue = monthlyRevenue + oneTimeRevenue
  const profit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

  return {
    monthlyRevenue,
    oneTimeRevenue,
    totalRevenue,
    totalCosts,
    profit,
    profitMargin,
    activeClients: activeClients || 0,
    averageNps,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do desempenho da agência</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Contratos + Serviços pontuais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.profit)}
            </div>
            <p className="text-xs text-muted-foreground">Margem: {data.profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeClients}</div>
            <p className="text-xs text-muted-foreground">NPS Médio: {data.averageNps}/10</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart />
        <NpsChart />
      </div>

      {/* Top Clients */}
      <TopClientsTable />
    </div>
  )
}
