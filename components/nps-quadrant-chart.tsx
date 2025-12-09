"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, Tooltip, ReferenceLine, Label, LabelList } from "recharts"

interface NpsQuadrantChartProps {
  data: Array<{
    name: string
    nps: number
    revenue: number
  }>
}

export function NpsQuadrantChart({ data }: NpsQuadrantChartProps) {
  // Calcula as médias para posicionar as linhas dos quadrantes
  const averageRevenue = data.length > 0 ? data.reduce((sum, item) => sum + item.revenue, 0) / data.length : 0
  const averageNps = data.length > 0 ? data.reduce((sum, item) => sum + item.nps, 0) / data.length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz Receita vs NPS</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            revenueNpsScatter: {
              label: "Clientes",
              color: "#3b82f6", // Azul
            },
          }}
          className="h-[450px]"
        >
          <ScatterChart
            margin={{
              top: 40,
              right: 30,
              bottom: 20,
              left: 30,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

            <XAxis
              type="number"
              dataKey="revenue"
              name="Receita (R$)"
              tickFormatter={(value) =>
                new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(
                  value,
                )
              }
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />

            <YAxis
              type="number"
              dataKey="nps"
              name="NPS Score"
              domain={[0, 10]}
              tickCount={11}
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />

            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => {
                    if (name === "revenue")
                      return [
                        `${props.payload.name} - Receita: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))}`,
                      ]
                    if (name === "nps") return [`NPS: ${value}`]
                    return value
                  }}
                  hideLabel
                />
              }
            />

            {/* Linhas de Referência (Médias) - Verde */}
            <ReferenceLine y={averageNps} stroke="#22c55e" strokeWidth={2} strokeDasharray="3 3">
              <Label value="Média NPS" position="insideTopLeft" fill="#22c55e" fontSize={12} fontWeight="bold" />
            </ReferenceLine>
            
            <ReferenceLine x={averageRevenue} stroke="#22c55e" strokeWidth={2} strokeDasharray="3 3">
              <Label
                value="Média Receita"
                position="insideTopLeft"
                fill="#22c55e"
                fontSize={12}
                fontWeight="bold"
                angle={-90}
                dx={-10}
                dy={20}
              />
            </ReferenceLine>

            {/* Scatter (Bolinhas) - Azul */}
            <Scatter name="Clientes" data={data} fill="#3b82f6">
              {/* Labels dos Clientes - Verde */}
              <LabelList dataKey="name" position="top" offset={8} fontSize={10} fill="#22c55e" fontWeight={500} />
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
