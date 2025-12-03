// Em wesystem6/app/dashboard/clients/page.tsx
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye, DollarSign, UserCheck } from "lucide-react"
import { AddClientForm } from "@/components/add-client-form"
import { Toaster } from "@/components/ui/sonner"
import { ClientFilters } from "@/components/client-filters"
import { NpsQuadrantChart } from "@/components/nps-quadrant-chart"
import { NpsScoreSummaryTable } from "@/components/nps-score-summary-table"
import { differenceInDays, parseISO, isPast, startOfMonth, format } from "date-fns"
// import { CriticalClientsAlert } from "@/components/critical-clients-alert"; // Removido
import { LowNpsAlertCard } from "@/components/low-nps-alert-card" // Importação do NOVO card

const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true
  return hasStarted && hasNotEnded
}

async function getClients({ name, status }: { name?: string; status?: string }) {
  const supabase = await createClient()
  let query = supabase
    .from("clients")
    .select(
      `
      id, name, status, health_status,
      contracts ( status, valor_mensal, start_date, end_date ),
      one_time_services(value, status),
      nps_responses(score, response_date)
    `,
    )
    .order("name")

  if (name) {
    query = query.ilike("name", `%${name}%`)
  }
  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data: clients } = await query
  const today = new Date()

  return clients?.map((client) => {
    const monthlyRevenue =
      client.contracts
        ?.filter((c) => c.status === "active" && isContractVigent(c))
        .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0

    const latestNps = client.nps_responses?.sort(
      (a, b) => new Date(b.response_date).getTime() - new Date(a.response_date).getTime(),
    )[0]?.score

    let generatedValue = 0
    let daysRemaining: number | null = null

    const activeContracts = client.contracts?.filter((c) => c.status === "active")

    if (activeContracts && activeContracts.length > 0) {
      const contractsWithEndDate = activeContracts.filter((c) => c.end_date)
      if (contractsWithEndDate.length > 0) {
        const futureContracts = contractsWithEndDate.filter((c) => !isPast(parseISO(c.end_date!)))
        if (futureContracts.length > 0) {
          const furthestEndDate = futureContracts.reduce((furthest, current) =>
            parseISO(current.end_date!) > parseISO(furthest.end_date!) ? current : furthest,
          ).end_date!
          daysRemaining = differenceInDays(parseISO(furthestEndDate), today)
        } else {
          daysRemaining = -1 // Indicates all active contracts have expired end dates
        }
      }
      // If no active contracts have end dates, daysRemaining remains null (Indeterminate)
    }

    client.contracts?.forEach((contract) => {
      if (contract.start_date && contract.valor_mensal > 0) {
        const startDate = parseISO(contract.start_date)
        const daysPassed = differenceInDays(today, startDate)
        if (daysPassed >= 0) {
          // Calculate revenue based on days passed since start date
          generatedValue += (contract.valor_mensal / 30.44) * (daysPassed + 1) // Using 30.44 average days in month
        }
      }
    })

    // Add revenue from completed one-time services to the generated value
    const completedOneTimeValue =
      client.one_time_services?.filter((s) => s.status === "completed").reduce((sum, s) => sum + Number(s.value), 0) ||
      0
    generatedValue += completedOneTimeValue

    return { ...client, monthlyRevenue, latestNps, generatedValue, daysRemaining }
  })
}

async function getAnalyticsData() {
  const supabase = await createClient()
  const today = new Date()

  // Fetch all contracts with client status
  const { data: allContracts } = await supabase
    .from("contracts")
    .select("valor_mensal, status, start_date, end_date, clients(status)") // Fetch client status along with contract

  // Calculate MRR from active clients with active and vigent contracts
  const monthlyRevenue =
    allContracts
      ?.filter((c) => c.clients?.status === "active" && c.status === "active" && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0

  // Calculate one-time revenue for the current month
  const startOfCurrentMonth = format(startOfMonth(today), "yyyy-MM-dd")
  const { data: services } = await supabase
    .from("one_time_services")
    .select("value")
    .eq("status", "completed")
    .gte("date", startOfCurrentMonth)
  const oneTimeRevenue = services?.reduce((sum, s) => sum + Number(s.value), 0) || 0

  // Fetch active clients data for NPS Quadrant Chart
  const { data: clientsData } = await supabase
    .from("clients")
    .select(`name, contracts(valor_mensal, status, start_date, end_date), nps_responses(score, response_date)`)
    .eq("status", "active")
    .order("response_date", { foreignTable: "nps_responses", ascending: false })
  const npsChartData =
    clientsData
      ?.map((client) => {
        const latestNps = client.nps_responses[0]?.score // Get the latest NPS score
        // Calculate MRR specifically for this client (for the chart)
        const clientMrr = client.contracts
          .filter((c) => c.status === "active" && isContractVigent(c))
          .reduce((sum, c) => sum + c.valor_mensal, 0)
        return { name: client.name, nps: latestNps, revenue: clientMrr }
      })
      .filter((c) => c.nps !== undefined) || [] // Ensure client has at least one NPS response

  // Fetch NPS responses for the current month for summary table
  const { data: currentMonthNps } = await supabase
    .from("nps_responses")
    .select("score")
    .gte("response_date", startOfCurrentMonth)

  const npsSummaryData = { detractors: 0, passives: 0, promoters: 0 }
  if (currentMonthNps && currentMonthNps.length > 0) {
    currentMonthNps.forEach((r) => {
      if (r.score <= 7)
        npsSummaryData.detractors++ // Updated: 0-7 are detractors
      else if (r.score === 8)
        npsSummaryData.passives++ // Updated: 8 are passives
      else npsSummaryData.promoters++ // 9-10 are promoters
    })
  }

  return { monthlyRevenue, oneTimeRevenue, npsChartData, npsSummaryData }
}

export default async function ClientsPage({ searchParams }: { searchParams?: { name?: string; status?: string } }) {
  const { name, status } = searchParams || {}

  // Fetch all necessary data concurrently
  const [clients, analytics, allClientsResult] = await Promise.all([
    getClients({ name, status }),
    getAnalyticsData(),
    createClient().then((supabase) => supabase.from("clients").select("status")), // Fetch only status for counting
  ])

  // Create ranked list of clients by NPS (worst first) - Garantindo que clients não é undefined
  const rankedClients =
    clients
      ?.filter((c) => c.latestNps !== undefined && c.status === "active") // Filter active clients with NPS scores
      .sort((a, b) => a.latestNps! - b.latestNps!) || [] // Sort ascending by latest NPS and provide default empty array

  // Calculate client counts
  const allClients = allClientsResult.data
  const totalClients = allClients?.length || 0
  const activeClients = allClients?.filter((c) => c.status === "active").length || 0

  // Map health status to Tailwind CSS background colors
  const healthStatusColors: { [key: string]: string } = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  }

  // Function to render remaining contract days with appropriate styling
  const renderRemainingDays = (days: number | null) => {
    if (days === null) return <span className="text-muted-foreground">Indet.</span>
    if (days < 0) return <Badge variant="destructive">Expirado</Badge>
    if (days <= 30) return <Badge variant="secondary">{days} dias</Badge> // Highlight if <= 30 days
    return <span className="text-muted-foreground">{days} dias</span>
  }

  return (
    <div className="space-y-6">
      <Toaster richColors />
      {/* ======> LINHA ABAIXO FOI ALTERADA PARA USAR O NOVO CARD: <===== */}
      <LowNpsAlertCard rankedClients={rankedClients} />
      {/* ============================================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie e analise sua base de clientes</p>
        </div>
        <AddClientForm />
      </div>

      {/* --- Cards de Resumo --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(analytics.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{" "}
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(analytics.oneTimeRevenue)}{" "}
              em serviços pontuais no mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">de {totalClients} clientes no total</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Gráficos de NPS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NpsQuadrantChart data={analytics.npsChartData || []} />
        {/* Passa os dados ranqueados para o componente de resumo */}
        <NpsScoreSummaryTable data={analytics.npsSummaryData} rankedClients={rankedClients || []} />
      </div>

      {/* --- Tabela Principal de Clientes --- */}
      <Card>
        <CardHeader>
          <ClientFilters /> {/* Componente de filtros */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead> {/* Coluna para Status de Saúde */}
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dias Restantes</TableHead>
                <TableHead className="text-center">Último NPS</TableHead>
                <TableHead className="text-right">Receita Mensal (MRR)</TableHead>
                <TableHead className="text-right">Valor Gerado (Est.)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients && clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    {/* Célula para Status de Saúde (bolinha colorida) */}
                    <TableCell>
                      <span
                        className={`block w-2.5 h-2.5 rounded-full ${healthStatusColors[client.health_status!] || "bg-gray-500"}`}
                        title={`Saúde: ${client.health_status || "Não definido"}`}
                      ></span>
                    </TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === "active" ? "default" : "outline"}>
                        {client.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderRemainingDays(client.daysRemaining)}</TableCell>
                    {/* Célula para Último NPS com badge colorida */}
                    <TableCell className="text-center">
                      {client.latestNps !== undefined ? (
                        <Badge
                          variant={
                            client.latestNps! <= 7 ? "destructive" : client.latestNps === 8 ? "secondary" : "default"
                          }
                        >
                          {client.latestNps}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        client.monthlyRevenue,
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        client.generatedValue,
                      )}
                    </TableCell>
                    {/* Célula de Ações com link para detalhes */}
                    <TableCell className="text-right">
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Linha exibida quando não há clientes
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {" "}
                    Nenhum cliente encontrado.{" "}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
