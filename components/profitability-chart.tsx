"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface ProfitabilityChartProps {
  data: Array<{
    name: string
    revenue: number
  }>
}

export function ProfitabilityChart({ data }: ProfitabilityChartProps) {
  const chartData = data.slice(0, 5).map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    receita: item.revenue,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Clientes por Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            receita: {
              label: "Receita",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="receita" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
