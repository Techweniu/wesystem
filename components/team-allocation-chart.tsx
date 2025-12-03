"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from "recharts"

interface TeamAllocationData {
  name: string
  role: string
  clients: number
}

interface TeamAllocationChartProps {
  data: TeamAllocationData[]
}

export function TeamAllocationChart({ data }: TeamAllocationChartProps) {
  // Filtra apenas quem tem clientes para não poluir o gráfico
  const chartData = data
    .filter(d => d.clients > 0)
    .sort((a, b) => a.clients - b.clients) // Ordena para o gráfico ficar bonito (maior no topo ou base)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga de Trabalho</CardTitle>
        <CardDescription>Número de clientes ativos por colaborador.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer
            config={{
              clients: {
                label: "Clientes",
                color: "hsl(var(--chart-2))", // Azul
              },
            }}
            className="h-[350px] w-full"
          >
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 0, right: 30, bottom: 0, left: 20 }} // Margem esquerda para nomes
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-border" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                tickLine={false}
                axisLine={false}
                className="text-xs font-medium"
                width={100}
              />
              <ChartTooltip 
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="clients" fill="var(--color-clients)" radius={[0, 4, 4, 0]}>
                <LabelList 
                  dataKey="clients" 
                  position="right" 
                  className="fill-foreground text-xs font-bold" 
                  formatter={(value: number) => value}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg">
            Nenhum cliente atribuído à equipe ainda.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
