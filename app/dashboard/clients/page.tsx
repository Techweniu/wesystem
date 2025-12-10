import { createAdminClient } from "@/lib/supabase/server"
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
import { differenceInDays, parseISO, isPast, startOfMonth, format, startOfDay, endOfDay } from "date-fns"
import { LowNpsAlertCard } from "@/components/low-nps-alert-card"
import { cookies } from "next/headers"
import { formatCurrency } from "@/lib/utils"

// CONFIGURAÇÃO DE CACHE:
// Força a página a ser dinâmica e não usar cache estático.
// Isso garante que os dados exibidos sejam sempre os atuais do banco.
export const dynamic = "force-dynamic"
export const revalidate = 0

const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true
  // CORREÇÃO: Usa endOfDay para garantir que o contrato vale até o fim do dia
  const hasNotEnded = contract.end_date ? !isPast(endOfDay(parseISO(contract.end_date))) : true
  return hasStarted && hasNotEnded
}

async function getEmployeesByRole() {
  // Admin Client para garantir leitura da lista de funcionários
  const supabase = createAdminClient()

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, role")
    .eq("status", "active")
    .order("name")

  const assessors = employees?.filter((e) => e.role === "Assessor") || []
  const videomakers = employees?.filter((e) => e.role === "Videomaker") || []
  const managers = employees?.filter((e) => e.role === "Gestor de Relacionamento") || []
  const editors = employees?.filter((e) => e.role === "Editor") || []

  return { assessors, videomakers, managers, editors }
}

async function getClients({ name, status }: { name?: string; status?: string }) {
  // Admin Client para garantir leitura dos clientes
  const supabase = createAdminClient()
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
  
  // CORREÇÃO: Normaliza a data de hoje para 00:00:00 para cálculos precisos de dias
  const today = startOfDay(new Date())

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
        // CORREÇÃO: Usa endOfDay para verificar contratos futuros
        const futureContracts = contractsWithEndDate.filter((c) => !isPast(endOfDay(parseISO(c.end_date!))))
        if (futureContracts.length > 0) {
          const furthestEndDate = futureContracts.reduce((furthest, current) =>
            parseISO(current.end_date!) > parseISO(furthest.end_date!) ? current : furthest,
          ).end_date!
          // CORREÇÃO: Cálculo de dias restantes com datas normalizadas
          daysRemaining = differenceInDays(parseISO(furthestEndDate), today)
        } else {
          daysRemaining = -1
        }
      }
    }

    client.contracts?.forEach((contract) => {
      if (contract.start_date && contract.valor_mensal > 0) {
        const startDate = parseISO(contract.start_date)
        // CORREÇÃO: Cálculo de dias passados com datas normalizadas
        const daysPassed = differenceInDays(today, startDate)
        if (daysPassed >= 0) {
          generatedValue += (contract.valor_mensal / 30.44) * (daysPassed + 1)
        }
      }
    })

    const completedOneTimeValue =
      client.one_time_services?.filter((s) => s.status === "completed").reduce((sum, s) => sum + Number(s.value), 0) ||
      0
    generatedValue += completedOneTimeValue

    return { ...client, monthlyRevenue, latestNps, generatedValue, daysRemaining }
  })
}

async function getAnalyticsData() {
  // Admin Client para garantir leitura dos dados analíticos
  const supabase = createAdminClient()
  const today = new Date()
  const startOfCurrentMonth = format(startOfMonth(today), "yyyy-MM-dd")

  const { data: allContracts } = await supabase
    .from("contracts")
    .select("valor_mensal, status, start_date, end_date, clients(status)")

  const monthlyRevenue =
    allContracts
      ?.filter((c) => c.clients?.status === "active" && c.status === "active" && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0

  const { data: services } = await supabase
    .from("one_time_services")
    .select("value")
    .eq("status", "completed")
    .gte("date", startOfCurrentMonth)
  const oneTimeRevenue = services?.reduce((sum, s) => sum + Number(s.value), 0) || 0

  const { data: clientsData } = await supabase
    .from("clients")
    .select(`name, contracts(valor_mensal, status, start_date, end_date), nps_responses(score, response_date)`)
    .eq("status", "active")
    .order("response_date", { foreignTable: "nps_responses", ascending: false })

  const npsChartData =
    clientsData
      ?.map((client) => {
        const latestNps = client.nps_responses[0]?.score
        const clientMrr = client.contracts
          .filter((c) => c.status === "active" && isContractVigent(c))
          .reduce((sum, c) => sum + c.valor_mensal, 0)
        return { name: client.name, nps: latestNps, revenue: clientMrr }
      })
      .filter((c) => c.nps !== undefined) || []

  const { data: currentMonthNps } = await supabase
    .from("nps_responses")
    .select("score")
    .gte("response_date", startOfCurrentMonth)

  const npsSummaryData = { detractors: 0, passives: 0, promoters: 0 }
  if (currentMonthNps && currentMonthNps.length > 0) {
    currentMonthNps.forEach((r) => {
      if (r.score <= 7) npsSummaryData.detractors++
      else if (r.score === 8) npsSummaryData.passives++
      else npsSummaryData.promoters++
    })
  }

  return { monthlyRevenue, oneTimeRevenue, npsChartData, npsSummaryData }
}

export default async function ClientsPage({ searchParams }: { searchParams?: { name?: string; status?: string } }) {
  const { name, status } = searchParams || {}

  // Buscando todos os dados necessários em paralelo
  const [clients, analytics, allClientsResult, teamData] = await Promise.all([
    getClients({ name, status }),
    getAnalyticsData(),
    createAdminClient()
      .from("clients")
      .select("status"), // Admin Client aqui também
    getEmployeesByRole(),
  ])

  // --- SEGURANÇA: Verificação de Role ---
  const cookieStore = cookies()
  const userRole = cookieStore.get("user_role")?.value
  const isLimited = userRole === "limited"
  // --------------------------------------

  const rankedClients =
    clients
      ?.filter((c) => c.latestNps !== undefined && c.status === "active")
      .sort((a, b) => a.latestNps! - b.latestNps!) || []

  const allClients = allClientsResult.data
  const totalClients = allClients?.length || 0
  const activeClients = allClients?.filter((c) => c.status === "active").length || 0

  const healthStatusColors: { [key: string]: string } = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  }

  const renderRemainingDays = (days: number | null) => {
    if (days === null) return <span className="text-muted-foreground">Indet.</span>
    if (days < 0) return <Badge variant="destructive">Expirado</Badge>
    if (days <= 30) return <Badge variant="secondary">{days} dias</Badge>
    return <span className="text-foreground font-medium">{days} dias</span>
  }

  return (
    <div className="space-y-6">
      <Toaster richColors />
      <LowNpsAlertCard rankedClients={rankedClients} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie e analise sua base de clientes</p>
        </div>
        {!isLimited && (
          <AddClientForm
            assessors={teamData.assessors}
            videomakers={teamData.videomakers}
            managers={teamData.managers}
            editors={teamData.editors}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.monthlyRevenue, isLimited)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{" "}
              {formatCurrency(analytics.oneTimeRevenue, isLimited)}{" "}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NpsQuadrantChart data={analytics.npsChartData || []} />
        <NpsScoreSummaryTable data={analytics.npsSummaryData} rankedClients={rankedClients || []} />
      </div>

      <Card>
        <CardHeader>
          <ClientFilters />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
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
                      {formatCurrency(client.monthlyRevenue, isLimited)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(client.generatedValue, isLimited)}
                    </TableCell>
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
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Nenhum cliente encontrado.
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
