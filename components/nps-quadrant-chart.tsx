"use client"

import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Dados de exemplo - idealmente viriam via props
const data = [
  { x: 85, y: 90, name: "Cliente A", revenue: 5000 },
  { x: 45, y: 30, name: "Cliente B", revenue: 2000 },
  { x: 20, y: 80, name: "Cliente C", revenue: 3500 },
  { x: 90, y: 20, name: "Cliente D", revenue: 1500 },
  { x: 60, y: 60, name: "Cliente E", revenue: 4000 },
  { x: 30, y: 40, name: "Cliente F", revenue: 1000 },
  { x: 75, y: 85, name: "Cliente G", revenue: 4500 },
  { x: 15, y: 25, name: "Cliente H", revenue: 800 },
]

const chartConfig = {
  nps: {
    label: "NPS",
    color: "hsl(var(--chart-1))",
  },
  engagement: {
    label: "Engajamento",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

// Função para determinar a cor com base no quadrante
const getColorForQuadrant = (x: number, y: number) => {
  const midX = 50
  const midY = 50

  if (x >= midX && y >= midY) return "hsl(var(--chart-2))" // Alta Fidelidade (Verde/Teal)
  if (x < midX && y < midY) return "hsl(var(--destructive))" // Risco (Vermelho)
  return "hsl(var(--chart-5))" // Oportunidade/Atenção (Amarelo/Laranja)
}

export function NpsQuadrantChart() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Matriz de Lealdade vs. Engajamento</CardTitle>
        <CardDescription>
          Distribuição de clientes baseada em NPS e Engajamento
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              
              {/* Linhas de Referência (Médias) */}
              <ReferenceLine 
                x={50} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                strokeWidth={2}
              >
                <Label 
                  value="Média NPS" 
                  position="insideTopRight" 
                  className="fill-muted-foreground text-xs font-medium" 
                  offset={10}
                />
              </ReferenceLine>
              
              <ReferenceLine 
                y={50} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                strokeWidth={2}
              >
                <Label 
                  value="Média Engajamento" 
                  position="insideTopRight" 
                  className="fill-muted-foreground text-xs font-medium" 
                  offset={10} 
                />
              </ReferenceLine>

              <XAxis 
                type="number" 
                dataKey="x" 
                name="NPS" 
                unit="" 
                domain={[0, 100]}
                className="text-xs font-medium text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Engajamento" 
                unit="%" 
                domain={[0, 100]}
                className="text-xs font-medium text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              
              <ChartTooltip 
                cursor={{ strokeDasharray: "3 3" }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Cliente
                            </span>
                            <span className="font-bold text-foreground">
                              {data.name}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Receita
                            </span>
                            <span className="font-bold text-foreground">
                              R$ {data.revenue}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              NPS
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {data.x}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Engajamento
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {data.y}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              
              <Scatter name="Clientes" data={data}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColorForQuadrant(entry.x, entry.y)}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
