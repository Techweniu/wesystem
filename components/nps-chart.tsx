import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NpsChartClient } from "./nps-chart-client"

async function getNpsData() {
  const supabase = await createClient()

  const { data: npsResponses } = await supabase.from("nps_responses").select("score")

  // Lógica de cálculo original restaurada
  const detractors = npsResponses?.filter((n) => n.score <= 6).length || 0
  const passives = npsResponses?.filter((n) => n.score >= 7 && n.score <= 8).length || 0
  const promoters = npsResponses?.filter((n) => n.score >= 9).length || 0

  // chart-5 = vermelho (detratores), chart-3 = amarelo (neutros), chart-1 = verde (promotores)
  return [
    { category: "Detratores", count: detractors, fill: "hsl(var(--chart-5))" },
    { category: "Neutros", count: passives, fill: "hsl(var(--chart-3))" },
    { category: "Promotores", count: promoters, fill: "hsl(var(--chart-1))" },
  ]
}

export async function NpsChart() {
  const data = await getNpsData()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição NPS</CardTitle>
      </CardHeader>
      <CardContent>
        <NpsChartClient data={data} />
      </CardContent>
    </Card>
  )
}
