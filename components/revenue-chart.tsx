"use client" // Convertido para client component para passar dados ao Chart Client

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChartClient } from "./revenue-chart-client"

// Define o tipo de dados esperado (ATUALIZADO)
type RevenueData = {
  month: string
  receita: number // Realizada
  custos: number  // Realizado
  lucro: number   // Realizado
  receita_estimada: number
  custo_estimado: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita vs. Custos (Últimos 6 Meses)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Linhas sólidas = Realizado (pago/recebido). Linhas pontilhadas = Estimado (pendente).
        </p>
      </CardHeader>
      <CardContent>
        {/* Passa os dados recebidos por props para o componente client */}
        <RevenueChartClient data={data} />
      </CardContent>
    </Card>
  )
}
