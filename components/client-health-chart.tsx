"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Cell, Legend } from "recharts"

interface ClientHealthChartProps {
  data: Array<{
    status: string
    count: number
    fill: string
  }>
}

export function ClientHealthChart({ data }: ClientHealthChartProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Saúde da Carteira</CardTitle>
        <CardDescription>Classificação de risco dos clientes ativos.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {data.some(d => d.count > 0) ? (
          <ChartContainer
            config={{
              green: { label: "Bom", color: "hsl(var(--chart-2))" },   // Azul/Verde
              yellow: { label: "Atenção", color: "hsl(var(--chart-4))" }, // Amarelo/Laranja
              red: { label: "Crítico", color: "hsl(var(--destructive))" }, // Vermelho
            }}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg m-4">
            Nenhum cliente classificado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
