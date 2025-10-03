"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, Tooltip, ReferenceLine, Label } from "recharts"

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
            npsScatter: {
              label: "Clientes",
              color: "hsl(0 0% 98%)",
            },
          }}
          className="h-[350px]"
        >
          <ScatterChart
            margin={{
              top: 20,
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

            {/* LINHAS DOS QUADRANTES CORRIGIDAS */}
            <ReferenceLine 
              y={averageNps} 
              stroke="hsl(0 0% 98%)" // Cor branca
              strokeWidth={1} // Linha mais fina e sólida
            >
              <Label value="Média NPS" position="insideTopLeft" fill="hsl(0 0% 98%)" fontSize={10} />
            </ReferenceLine>
            <ReferenceLine 
              x={averageRevenue} 
              stroke="hsl(0 0% 98%)" // Cor branca
              strokeWidth={1} // Linha mais fina e sólida
            >
               <Label value="Média Receita" position="insideTopLeft" fill="hsl(0 0% 98%)" fontSize={10} angle={-90} dy={-10} />
            </ReferenceLine>

            <Scatter data={data} fill="hsl(0 0% 98%)" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
