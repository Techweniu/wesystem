"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface ProfitabilityChartProps {
  data: Array<{
    name: string
    revenue: number
    cost: number
    profit: number
    margin: number
  }>
}

export function ProfitabilityChart({ data }: ProfitabilityChartProps) {
  // Pega os top 5 ou bottom 5, dependendo de como os dados vêm ordenados.
  // Vamos assumir que queremos ver os 5 com menor lucro (prejuízo) ou maior receita,
  // mas aqui vou mostrar os dados como vierem (já filtrados pela página pai).
  const chartData = data.map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    receita: item.revenue,
    custo: item.cost,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita vs. Custo (Top Clientes)</CardTitle>
        <CardDescription>Comparativo financeiro direto.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            receita: {
              label: "Receita",
              color: "#22c55e", // Verde
            },
            custo: {
              label: "Custo Estimado",
              color: "#ef4444", // Vermelho
            },
          }}
          className="h-[300px]"
        >
          <BarChart data={chartData} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis 
              dataKey="name" 
              className="text-xs" 
              tick={{ fill: "#888888" }} 
              interval={0} 
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "#888888" }}
              tickFormatter={(value) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex min-w-[130px] items-center text-xs text-muted-foreground">
                      {name === "receita" ? "Receita" : "Custo"}:
                      <span className="ml-auto font-mono font-medium text-foreground">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="custo" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
