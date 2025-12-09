"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts"

interface CommercialFunnelChartProps {
  data: Array<{
    stage: string
    count: number
    fill: string
  }>
}

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
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[300px]"
          >
            <BarChart
              data={data}
              margin={{ top: 20 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="stage"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-xs"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={8}>
                <LabelList
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
