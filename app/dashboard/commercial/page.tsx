import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { AddCommercialGoalForm } from "@/components/add-commercial-goal-form"
import { CommercialGoalCard } from "@/components/commercial-goal-card"
import { ClientCommercialCard } from "@/components/client-commercial-card"
import { Target, TrendingUp, Users } from "lucide-react"
import { parseISO, isWithinInterval, isPast, format } from "date-fns"

const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true
  return hasStarted && hasNotEnded
}

async function getCommercialData() {
  const supabase = await createClient()

  const { data: goals } = await supabase
    .from("commercial_goals")
    .select("*")
    .order("period_start", { ascending: false })

  const { data: clients } = await supabase
    .from("clients")
    .select(
      `
      *,
      contracts (
        id,
        valor_mensal,
        start_date,
        end_date,
        status
      ),
      one_time_services:one_time_services (
        id,
        value,
        date,
        status
      ),
      client_upsells (
        id,
        status,
        identified_date,
        services,
        notes
      )
    `,
    )
    .order("name")

  return { goals: goals || [], clients: clients || [] }
}

function calculateRevenueForPeriod(clients: any[], periodStart: Date, periodEnd: Date): number {
  let revenue = 0

  clients.forEach((client) => {
    // Calcular receita de contratos ativos no período
    client.contracts?.forEach((contract: any) => {
      if (contract.status === "active" && contract.start_date) {
        const contractStart = parseISO(contract.start_date)
        const contractEnd = contract.end_date ? parseISO(contract.end_date) : new Date()

        // Verificar se o contrato está ativo durante o período
        if (
          isWithinInterval(contractStart, { start: periodStart, end: periodEnd }) ||
          isWithinInterval(contractEnd, { start: periodStart, end: periodEnd }) ||
          (contractStart <= periodStart && contractEnd >= periodEnd)
        ) {
          // Calcular quantos meses do contrato estão no período
          const monthsInPeriod = Math.ceil(
            (Math.min(periodEnd.getTime(), contractEnd.getTime()) -
              Math.max(periodStart.getTime(), contractStart.getTime())) /
              (1000 * 60 * 60 * 24 * 30.44),
          )
          revenue += contract.valor_mensal * Math.max(1, monthsInPeriod)
        }
      }
    })

    // Adicionar serviços pontuais concluídos no período
    client.one_time_services?.forEach((service: any) => {
      if (service.status === "completed" && service.date) {
        const serviceDate = parseISO(service.date)
        if (isWithinInterval(serviceDate, { start: periodStart, end: periodEnd })) {
          revenue += Number(service.value)
        }
      }
    })
  })

  return revenue
}

function calculateRecurringRevenue(clients: any[]): number {
  let revenue = 0

  clients.forEach((client) => {
    if (client.status !== "active") return

    // Calcular apenas receita de contratos ativos e vigentes
    client.contracts?.forEach((contract: any) => {
      if (contract.status === "active" && isContractVigent(contract)) {
        revenue += contract.valor_mensal
      }
    })
  })

  return revenue
}

export default async function CommercialPage() {
  const { goals, clients } = await getCommercialData()

  const recurringRevenue = calculateRecurringRevenue(clients)

  const goalsWithRevenue = goals.map((goal) => {
    const periodStart = parseISO(goal.period_start)
    const periodEnd = parseISO(goal.period_end)
    const realizedRevenue = calculateRevenueForPeriod(clients, periodStart, periodEnd)

    return {
      ...goal,
      realized_revenue: realizedRevenue,
      recurring_revenue: recurringRevenue, // Adicionando receita recorrente
      progress: (realizedRevenue / goal.target_value) * 100,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8" />
            Comercial
          </h1>
          <p className="text-muted-foreground">Acompanhe metas, clientes e oportunidades de upsell</p>
        </div>
        <AddCommercialGoalForm />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas Comerciais
        </h2>
        {goalsWithRevenue.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma meta cadastrada ainda.
                <br />
                Adicione sua primeira meta comercial para começar o acompanhamento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goalsWithRevenue.map((goal) => (
              <CommercialGoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Clientes e Oportunidades
        </h2>
        {clients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Nenhum cliente cadastrado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <ClientCommercialCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
