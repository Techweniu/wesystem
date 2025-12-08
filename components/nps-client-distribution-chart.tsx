"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, LabelList } from "recharts"

interface NpsClientDistributionChartProps {
  data: Array<{
    name: string
    nps: number
  }>
}

export function NpsClientDistributionChart({ data }: NpsClientDistributionChartProps) {
  const chartData = data.map((item, index) => ({
    x: index, // Usamos o índice para espaçar os clientes no eixo X
    y: item.nps,
    name: item.name,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de NPS por Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            scatter: {
              label: "Clientes",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[400px]"
        >
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 40,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              dataKey="x"
              tickFormatter={(value) => data[value]?.name || ''}
              interval={0}
              angle={-45}
              textAnchor="end"
              className="text-xs"
              height={80}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="NPS Score"
              domain={[0, 10]}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip 
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value, name, props) => `${props.payload.name}: ${value}`}
                    hideLabel
                />} 
            />
            <Scatter data={chartData} fill="hsl(var(--chart-2))" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
