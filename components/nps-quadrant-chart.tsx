"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
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
  const averageRevenue = data.length > 0 ? data.reduce((sum, item) => sum + item.revenue, 0) / data.length : 0;
  const averageNps = data.length > 0 ? data.reduce((sum, item) => sum + item.nps, 0) / data.length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz Receita vs NPS</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            // CORES REVERTIDAS CONFORME SOLICITADO
            revenueNpsScatter: {
              label: "Clientes",
              color: "#002492", // Cor das bolinhas (azul)
            },
            referenceLines: {
                label: "Médias",
                color: "#03d967", // Cor das linhas (verde)
            }
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
              tickFormatter={(value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: 'compact' }).format(value)}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />

            <YAxis
              type="number"
              dataKey="nps"
              name="NPS Score"
              domain={[0, 10]}
              tickCount={11}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />

            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent formatter={(value, name, props) => {
                if (name === 'revenue') return [`${props.payload.name} - Receita: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}`];
                if (name === 'nps') return [`NPS: ${value}`];
                return value;
              }} hideLabel />} />

            <ReferenceLine 
              y={averageNps} 
              stroke="var(--color-referenceLines)"
              strokeWidth={1}
            >
              <Label value="Média NPS" position="insideTopLeft" fill="var(--color-referenceLines)" fontSize={10} />
            </ReferenceLine>
            <ReferenceLine 
              x={averageRevenue} 
              stroke="var(--color-referenceLines)"
              strokeWidth={1}
            >
               <Label value="Média Receita" position="insideTopLeft" fill="var(--color-referenceLines)" fontSize={10} angle={-90} dy={-10} />
            </ReferenceLine>

            <Scatter data={data} fill="var(--color-revenueNpsScatter)">
              <LabelList 
                dataKey="name" 
                position="top" 
                offset={8} 
                fontSize={10} 
                fill="hsl(var(--foreground))" 
              />
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
