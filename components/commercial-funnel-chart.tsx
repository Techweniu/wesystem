"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { stage: "Leads", value: 500, fill: "hsl(var(--chart-1))" },
  { stage: "Qualificados", value: 350, fill: "hsl(var(--chart-2))" },
  { stage: "Proposta", value: 200, fill: "hsl(var(--chart-3))" },
  { stage: "Negociação", value: 100, fill: "hsl(var(--chart-4))" },
  { stage: "Fechado", value: 50, fill: "hsl(var(--chart-5))" },
]

const chartConfig = {
  value: {
    label: "Valor",
    color: "hsl(var(--primary))",
  },
  Leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  Qualificados: {
    label: "Qualificados",
    color: "hsl(var(--chart-2))",
  },
  Proposta: {
    label: "Proposta",
    color: "hsl(var(--chart-3))",
  },
  Negociação: {
    label: "Negociação",
    color: "hsl(var(--chart-4))",
  },
  Fechado: {
    label: "Fechado",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function CommercialFunnelChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Vendas</CardTitle>
        <CardDescription>Conversão por etapa do funil</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20,
            }}
          >
            <CartesianGrid horizontal={false} className="stroke-muted" />
            <YAxis
              dataKey="stage"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-xs font-medium text-muted-foreground"
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" layout="vertical" radius={5}>
              {/* Mapeamento explicito de cores para cada etapa */}
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="stage"
                position="insideLeft"
                offset={8}
                className="fill-background font-medium drop-shadow-sm"
                fontSize={12}
              />
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground font-bold"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
