"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, LabelList, Cell } from "recharts"

interface CommercialFunnelChartProps {
  data: Array<{
    stage: string
    count: number
    fill: string
  }>
}

// Cores fixas para garantir visualização (Azul -> Amarelo -> Verde)
const FUNNEL_COLORS = ["#3b82f6", "#f59e0b", "#22c55e"]

export function CommercialFunnelChart({ data }: CommercialFunnelChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Upsell</CardTitle>
        <CardDescription>Oportunidades por estágio de negociação.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.some(d => d.count > 0) ? (
          <ChartContainer
            config={{
              count: {
                label: "Oportunidades",
                color: "#3b82f6",
              },
            }}
            className="h-[300px]"
          >
            <BarChart
              data={data}
              margin={{ top: 20 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="stage"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-xs"
                tick={{ fill: "#888888" }}
              />
              <ChartTooltip
                cursor={{ fill: "transparent" }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} 
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg m-4">
            Nenhuma oportunidade registrada.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
