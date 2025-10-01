"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

type RevenueData = {
  month: string
  receita: number
  custos: number
  lucro: number
}

export function RevenueChartClient({ data }: { data: RevenueData[] }) {
  return (
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
  )
}
