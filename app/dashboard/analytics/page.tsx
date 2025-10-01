import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProfitabilityChart } from "@/components/profitability-chart"
import { NpsQuadrantChart } from "@/components/nps-quadrant-chart"
import { TeamAllocationChart } from "@/components/team-allocation-chart"

async function getAnalyticsData() {
  const supabase = await createClient()

  // Get client profitability (based on one-time services)
  const { data: clients } = await supabase
    .from("clients")
    .select(
      `
      id,
      name,
      one_time_services (value, status)
    `,
    )
    .eq("status", "active")

  const clientProfitability = clients?.map((client) => {
    const serviceRevenue =
      client.one_time_services
        ?.filter((s: { status: string }) => s.status === "completed")
        .reduce((sum: number, s: { value: number }) => sum + Number(s.value), 0) || 0

    return {
      id: client.id,
      name: client.name,
      revenue: serviceRevenue,
    }
  })

  // Get NPS data with revenue (now based on one-time services)
  const { data: npsData } = await supabase.from("nps_responses").select(
    `
      client_id,
      score,
      clients (
        name,
        one_time_services (value, status)
      )
    `,
  )

  const npsWithRevenue = npsData?.reduce((acc: any[], response: any) => {
    const existing = acc.find((item) => item.client_id === response.client_id)
    const revenue =
      response.clients?.one_time_services
        ?.filter((s: { status: string }) => s.status === "completed")
        .reduce((sum: number, s: { value: number }) => sum + Number(s.value), 0) || 0

    if (existing) {
      existing.scores.push(response.score)
    } else {
      acc.push({
        client_id: response.client_id,
        name: response.clients?.name,
        scores: [response.score],
        revenue,
      })
    }
    return acc
  }, [])

  const npsQuadrant = npsWithRevenue?.map((item: any) => ({
    name: item.name,
    nps: item.scores.reduce((a: number, b: number) => a + b, 0) / item.scores.length,
    revenue: item.revenue,
  }))

  // Get team allocation
  const currentMonth = new Date().toISOString().slice(0, 7)
  const { data: timeLogs } = await supabase
    .from("time_logs")
    .select(
      `
      hours,
      employee:employees (name, department),
      client:clients (name)
    `,
    )
    .gte("date", `${currentMonth}-01`)

  const departmentHours = timeLogs?.reduce((acc: any, log: any) => {
    const dept = log.employee?.department || "Sem departamento"
    acc[dept] = (acc[dept] || 0) + Number(log.hours)
    return acc
  }, {})

  return {
    clientProfitability: clientProfitability?.sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    npsQuadrant,
    departmentHours,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Análises avançadas e insights de negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ProfitabilityChart data={data.clientProfitability || []} />
        <TeamAllocationChart data={data.departmentHours || {}} />
      </div>

      <NpsQuadrantChart data={data.npsQuadrant || []} />

      <Card>
        <CardHeader>
          <CardTitle>Ranking de Lucratividade por Cliente (Serviços Pontuais)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Receita Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.clientProfitability?.map((client: any, index: number) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Badge variant={index < 3 ? "default" : "outline"}>#{index + 1}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(client.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
