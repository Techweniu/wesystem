"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { status: "Saudável", clients: 45, fill: "hsl(var(--chart-2))" }, // Verde/Teal
  { status: "Em Atenção", clients: 12, fill: "hsl(var(--chart-5))" }, // Amarelo/Laranja
  { status: "Crítico", clients: 5, fill: "hsl(var(--destructive))" }, // Vermelho
]

const chartConfig = {
  clients: {
    label: "Clientes",
    color: "hsl(var(--primary))",
  },
  Saudável: {
    label: "Saudável",
    color: "hsl(var(--chart-2))",
  },
  "Em Atenção": {
    label: "Em Atenção",
    color: "hsl(var(--chart-5))",
  },
  Crítico: {
    label: "Crítico",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

export function ClientHealthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saúde da Carteira</CardTitle>
        <CardDescription>Distribuição de clientes por status de saúde</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="status"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-xs font-medium text-muted-foreground"
              tickFormatter={(value) => value}
            />
            <ChartTooltip 
              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
              content={<ChartTooltipContent hideLabel />} 
            />
            <Bar 
              dataKey="clients" 
              radius={[4, 4, 0, 0]}
            >
              {/* Garante que cada barra use a cor definida no dado, ou fallback para config */}
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
