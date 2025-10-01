import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChartClient } from "./revenue-chart-client"

async function getRevenueData() {
  const supabase = await createClient()

  const months = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - i)
    months.push(date)
  }

  const data = await Promise.all(
    months.map(async (monthDate) => {
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth()

      const startDate = new Date(year, month, 1).toISOString().slice(0, 10)
      const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)
      const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "short" })

      // A receita de contrato foi removida daqui

      // Get one-time services
      const { data: services } = await supabase
        .from("one_time_services")
        .select("value")
        .eq("status", "completed")
        .gte("date", startDate)
        .lte("date", endDate)

      const serviceRevenue = services?.reduce((sum, s) => sum + Number(s.value), 0) || 0

      // Get costs
      const { data: costs } = await supabase.from("costs").select("value").gte("date", startDate).lte("date", endDate)

      const totalCosts = costs?.reduce((sum, c) => sum + Number(c.value), 0) || 0

      const totalRevenue = serviceRevenue // A receita total agora é só de serviços

      return {
        month: monthLabel,
        receita: totalRevenue,
        custos: totalCosts,
        lucro: totalRevenue - totalCosts,
      }
    }),
  )

  return data
}

export async function RevenueChart() {
  const data = await getRevenueData()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita de Serviços vs Custos</CardTitle>
      </CardHeader>
      <CardContent>
        <RevenueChartClient data={data} />
      </CardContent>
    </Card>
  )
}
