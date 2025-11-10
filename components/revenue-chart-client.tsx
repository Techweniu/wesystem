"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

// Tipo de dados ATUALIZADO
type RevenueData = {
  month: string
  receita: number // Realizada
  custos: number  // Realizado
  lucro: number   // Realizado
  receita_estimada: number
  custo_estimado: number
}

export function RevenueChartClient({ data }: { data: RevenueData[] }) {
  return (
    <ChartContainer
      config={{
        receita: {
          label: "Receita (Realizada)",
          color: "hsl(var(--chart-1))",
        },
        custos: {
          label: "Custos (Realizado)",
          color: "hsl(var(--chart-5))",
        },
        lucro: {
          label: "Lucro (Realizado)",
          color: "hsl(var(--chart-2))",
        },
        // --- NOVAS CONFIGURAÇÕES ---
        receita_estimada: {
          label: "Receita (Estimada)",
          color: "hsl(var(--chart-1))",
        },
        custo_estimado: {
          label: "Custo (Estimado)",
          color: "hsl(var(--chart-5))",
        },
        // --- FIM DA ATUALIZAÇÃO ---
      }}
      className="h-[300px]"
    >
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        
        {/* --- ÁREAS REALIZADAS (Sólidas, com sombra) --- */}
        <Area
          type="monotone"
          dataKey="receita"
          stroke="hsl(var(--chart-1))"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.4}
        />
        <Area
          type="monotone"
          dataKey="custos"
          stroke="hsl(var(--chart-5))"
          fill="hsl(var(--chart-5))"
          fillOpacity={0.4}
        />
        <Area
          type="monotone"
          dataKey="lucro"
          stroke="hsl(var(--chart-2))"
          fill="hsl(var(--chart-2))"
          fillOpacity={0.5}
        />

        {/* --- ÁREAS ESTIMADAS (Pontilhadas, sem sombra) --- */}
        <Area
          type="monotone"
          dataKey="receita_estimada"
          stroke="hsl(var(--chart-1))"
          strokeDasharray="5 5" // <-- Linha pontilhada
          fillOpacity={0}         // <-- Sem sombra
        />
        <Area
          type="monotone"
          dataKey="custo_estimado"
          stroke="hsl(var(--chart-5))"
          strokeDasharray="5 5" // <-- Linha pontilhada
          fillOpacity={0}         // <-- Sem sombra
        />
      </AreaChart>
    </ChartContainer>
  )
}
