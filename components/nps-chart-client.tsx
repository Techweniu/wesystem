"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

type NpsData = {
  category: string
  count: number
  fill: string
}

export function NpsChartClient({ data }: { data: NpsData[] }) {
  return (
    <ChartContainer
      config={{
        count: {
          label: "Respostas",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[300px]"
    >
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="category" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
