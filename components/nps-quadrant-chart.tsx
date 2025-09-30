"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts"

interface NpsQuadrantChartProps {
  data: Array<{
    name: string
    nps: number
    revenue: number
  }>
}

export function NpsQuadrantChart({ data }: NpsQuadrantChartProps) {
  const chartData = data.map((item) => ({
    x: item.nps,
    y: item.revenue,
    z: item.revenue / 1000,
    name: item.name,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz NPS vs Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            scatter: {
              label: "Clientes",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[400px]"
        >
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              dataKey="x"
              name="NPS"
              domain={[0, 10]}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{ value: "NPS Score", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Receita"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{ value: "Receita (R$)", angle: -90, position: "insideLeft" }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Scatter data={chartData} fill="hsl(var(--chart-1))" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
