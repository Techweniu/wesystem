import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

async function getRevenueData() {
  const supabase = await createClient()

  const months = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    // Garante que não teremos problemas com meses de durações diferentes
    date.setDate(1) 
    date.setMonth(date.getMonth() - i)
    months.push(date)
  }

  const data = await Promise.all(
    months.map(async (monthDate) => {
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth()
      
      const startDate = new Date(year, month, 1).toISOString().slice(0, 10)
      // Pega o último dia do mês corretamente
      const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)
      const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "short" })

      // Get contracts revenue
      const { data: contracts } = await supabase
        .from("contracts")
        .select("monthly_value")
        .eq("status", "active")
        .lte("start_date", endDate)

      const contractRevenue = contracts?.reduce((sum, c) => sum + Number(c.monthly_value), 0) || 0

      // Get one-time services
      const { data: services } = await supabase
        .from("one_time_services")
        .select("value")
        .eq("status", "completed")
        .gte("date", startDate)
        .lte("date", endDate)

      const serviceRevenue = services?.reduce((sum, s) => sum + Number(s.value), 0) || 0

      // Get costs
      const { data: costs } = await supabase
        .from("costs")
        .select("value")
        .gte("date", startDate)
        .lte("date", endDate)

      const totalCosts = costs?.reduce((sum, c) => sum + Number(c.value), 0) || 0

      const totalRevenue = contractRevenue + serviceRevenue

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
        <CardTitle>Receita vs Custos</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            receita: {
              label: "Receita",
              color: "hsl(var(--chart-1))",
            },
            custos: {
              label: "Custos",
              color: "hsl(var(--chart-5))",
            },
            lucro: {
              label: "Lucro",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="receita"
              stackId="1"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="custos"
              stackId="2"
              stroke="hsl(var(--chart-5))"
              fill="hsl(var(--chart-5))"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
