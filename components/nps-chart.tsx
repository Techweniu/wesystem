import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

async function getNpsData() {
  const supabase = await createClient()

  const { data: npsResponses } = await supabase.from("nps_responses").select("score")

  // Count scores by category
  const detractors = npsResponses?.filter((n) => n.score <= 6).length || 0
  const passives = npsResponses?.filter((n) => n.score >= 7 && n.score <= 8).length || 0
  const promoters = npsResponses?.filter((n) => n.score >= 9).length || 0

  return [
    { category: "Detratores", count: detractors, fill: "hsl(var(--chart-5))" },
    { category: "Neutros", count: passives, fill: "hsl(var(--chart-3))" },
    { category: "Promotores", count: promoters, fill: "hsl(var(--chart-2))" },
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
        <ChartContainer
          config={{
            count: {
              label: "Respostas",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="category" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
