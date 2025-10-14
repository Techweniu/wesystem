import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";
import { RevenueChart } from "@/components/revenue-chart";
import { NpsChart } from "@/components/nps-chart";
import { TopClientsTable } from "@/components/top-clients-table";
import { AiInsightsPanel } from "@/components/ai-insights-panel"; // 1. Importe o novo componente

async function getDashboardData() {
  const supabase = await createClient();

  // Get one-time services revenue (current month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: services } = await supabase
    .from("one_time_services")
    .select("value")
    .eq("status", "completed")
    .gte("date", `${currentMonth}-01`);

  const oneTimeRevenue = services?.reduce((sum, s) => sum + Number(s.value), 0) || 0;

  // Get total costs (current month)
  const { data: costs } = await supabase.from("costs").select("value").gte("date", `${currentMonth}-01`);

  const totalCosts = costs?.reduce((sum, c) => sum + Number(c.value), 0) || 0;

  // Get active clients count
  const { count: activeClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get average NPS
  const { data: npsData } = await supabase.from("nps_responses").select("score");

  let averageNps = 0;
  if (npsData && npsData.length > 0) {
    const totalScore = npsData.reduce((sum, n) => sum + n.score, 0);
    averageNps = Math.round(totalScore / npsData.length);
  }

  const totalRevenue = oneTimeRevenue;
  const profit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalCosts,
    profit,
    profitMargin,
    activeClients: activeClients || 0,
    averageNps,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* O painel de insights foi removido do topo geral */}
      
      {/* 2. Adicione o painel de insights aqui */}
      <AiInsightsPanel />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do desempenho da agência</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Serviços Pontuais)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Receita do mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro (Mês)</CardTitle>
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
            <CardTitle className="text-sm font-medium">Custos (Mês)</CardTitle>
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

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart />
        <NpsChart />
      </div>

      <TopClientsTable />
    </div>
  );
}
