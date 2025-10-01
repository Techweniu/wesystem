"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, Tooltip } from "recharts"

interface NpsQuadrantChartProps {
  data: Array<{
    name: string
    nps: number
    revenue: number
  }>
}

export function NpsQuadrantChart({ data }: NpsQuadrantChartProps) {

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
          // MUDANÇA AQUI: Diminuímos a altura para esticar o gráfico horizontalmente
          className="h-[350px]" 
        >
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            
            {/* EIXO X AGORA É A RECEITA */}
            <XAxis
              type="number"
              dataKey="revenue" // MUDANÇA AQUI
              name="Receita (R$)"
              tickFormatter={(value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: 'compact' }).format(value)}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />

            {/* EIXO Y AGORA É O NPS */}
            <YAxis
              type="number"
              dataKey="nps" // MUDANÇA AQUI
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
            <Scatter data={data} fill="hsl(0 0% 98%)" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
