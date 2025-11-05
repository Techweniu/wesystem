// sistema/app/dashboard/financial/page.tsx
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users } from "lucide-react" // Adicionado ícone Users
import { AddCostDialog } from "@/components/add-cost-dialog"
import { FinancialTable } from "@/components/financial-table"
import { FinancialCharts } from "@/components/financial-charts"
import { PeriodSelector } from "@/components/period-selector"
import { ClientPaymentsTable } from "@/components/client-payments-table" // Importar o novo componente
import { FinancialSummaryCards } from "@/components/financial-summary-cards"
import { EmployeePaymentsTable } from "@/components/employee-payments-table" // Importar novo componente
import { parseISO, format, isPast, addMonths } from "date-fns" // Funções adicionadas de date-fns
import { ptBR } from "date-fns/locale"

// Função auxiliar (pode ser movida para utils se necessário)
const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  // Verifica se a data de início já passou ou é hoje
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true // Se não tem data de início, considera que começou
  // Verifica se a data de fim ainda não passou
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true // Se não tem data de fim, considera que não terminou
  return hasStarted && hasNotEnded
}

async function getFinancialData(period = "month") {
  const supabase = await createClient()
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let startDate: Date
  let endDate: Date

  switch (period) {
    case "week":
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
      endDate = today
      break
    case "month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0) // Último dia do mês
      break
    case "quarter":
      startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
      endDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0)
      break
    case "year":
      startDate = new Date(today.getFullYear(), 0, 1)
      endDate = new Date(today.getFullYear(), 11, 31)
      break
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  }

  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  const { data: services } = await supabase
    .from("one_time_services")
    .select("*, clients(name)")
    .gte("date", startDateStr)
    .lte("date", endDateStr) // Filtrar até o fim do período
    .order("date", { ascending: false })

  const { data: costs } = await supabase
    .from("costs")
    .select("*, proof_url")
    .gte("date", startDateStr)
    .lte("date", endDateStr) // Filtrar até o fim do período
    .order("date", { ascending: false })

  const costsWithPaymentStatus = costs?.map((cost) => ({
    ...cost,
    is_paid: !!cost.paid_date,
  }))

  // CORREÇÃO 1: Adicionado "payment_day" ao select
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, salary, payment_day")
    .eq("status", "active")
    .order("name")

  // Busca clientes com contratos e pagamentos dentro do período
  const { data: clientsWithContracts } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      status,
      contracts (id, name, valor_mensal, start_date, end_date, status),
      client_payments (amount, payment_date, contract_id)
    `)
    .eq("status", "active") // Apenas clientes ativos
    .order("name") // Ordena por nome

  // Busca pagamentos de clientes dentro do período
  const { data: clientPaymentsData } = await supabase
    .from("client_payments")
    .select("amount, payment_date, proof_url, client_id")
    .gte("payment_date", startDateStr)
    .lte("payment_date", endDateStr)

  const clientPaymentProofs = new Map<string, string>()
  clientPaymentsData?.forEach((payment) => {
    if (payment.proof_url && payment.client_id) {
      clientPaymentProofs.set(payment.client_id, payment.proof_url)
    }
  })

  // Processa os dados dos clientes para a tabela de pagamentos
  const clientPayments = clientsWithContracts
    ?.map((client) => {
      // Filtra contratos ativos e vigentes
      const activeContracts = client.contracts.filter((c) => c.status === "active" && isContractVigent(c))
      // Soma o valor mensal dos contratos ativos/vigentes
      const expectedMonthlyPayment = activeContracts.reduce((sum, c) => sum + Number(c.valor_mensal || 0), 0)

      // Verifica se há um pagamento registrado neste mês/ano
      const paymentThisMonth = client.client_payments.find((p) => {
        const paymentDate = parseISO(p.payment_date)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })
      const isPaidThisMonth = !!paymentThisMonth

      // Determina a próxima data de pagamento
      let nextPaymentDateFormatted = null
      const paymentDay = 1
      if (activeContracts.length > 0) {
        let nextPaymentDate = new Date(currentYear, currentMonth, paymentDay)

        if (today.getDate() > paymentDay && !isPaidThisMonth) {
          nextPaymentDate = addMonths(nextPaymentDate, 1)
        } else if (isPaidThisMonth) {
          nextPaymentDate = addMonths(nextPaymentDate, 1)
        }

        nextPaymentDateFormatted = format(nextPaymentDate, "dd/MM/yyyy", { locale: ptBR })
      }

      return {
        clientId: client.id,
        clientName: client.name,
        expectedAmount: expectedMonthlyPayment,
        isPaidThisMonth: isPaidThisMonth,
        nextPaymentDate: nextPaymentDateFormatted,
        activeContracts: activeContracts.map((c) => ({ id: c.id, name: c.name })),
        proofUrl: clientPaymentProofs.get(client.id) || null,
      }
    })
    .filter((p) => p.expectedAmount > 0)
    .sort((a, b) => a.clientName.localeCompare(b.clientName))

  const contractsReceived = clientPaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const { data: activeContracts } = await supabase
    .from("contracts")
    .select("valor_mensal, start_date, end_date")
    .eq("status", "active")

  // Filtrar contratos que estão vigentes no período selecionado
  const contractsPending =
    activeContracts
      ?.filter((c) => {
        if (!isContractVigent(c)) return false

        // Verificar se o contrato está ativo no período selecionado
        const contractStart = c.start_date ? parseISO(c.start_date) : startDate
        const contractEnd = c.end_date ? parseISO(c.end_date) : endDate

        // Contrato deve ter começado antes do fim do período e não ter terminado antes do início
        return contractStart <= endDate && contractEnd >= startDate
      })
      .reduce((sum, c) => sum + Number(c.valor_mensal || 0), 0) || 0

  const { data: employeePaymentsData } = await supabase
    .from("employee_payments")
    .select("amount, payment_date")
    .gte("payment_date", startDateStr)
    .lte("payment_date", endDateStr) // Filtrar até o fim do período

  const salariesPaid = employeePaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const { data: employeesWithPayments } = await supabase
    .from("employees")
    .select(`
      id,
      salary,
      employee_payments!inner(payment_date)
    `)
    .eq("status", "active")

  // Funcionários que já foram pagos no período selecionado
  const paidEmployeeIds = new Set(
    employeesWithPayments
      ?.filter((e) => {
        const payment = e.employee_payments[0]
        if (!payment) return false
        const paymentDate = new Date(payment.payment_date)
        return paymentDate >= startDate && paymentDate <= endDate
      })
      .map((e) => e.id) || [],
  )

  // Salários pendentes apenas para o período atual
  const salariesPending =
    employees?.filter((e) => !paidEmployeeIds.has(e.id)).reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0

  const otherCostsPaid =
    costsWithPaymentStatus?.filter((c) => c.is_paid).reduce((sum, c) => sum + Number(c.value), 0) || 0
  const otherCostsPending =
    costsWithPaymentStatus?.filter((c) => !c.is_paid).reduce((sum, c) => sum + Number(c.value), 0) || 0

  const completedServices = services?.filter((s) => s.status === "completed") || []
  const servicesRevenue = completedServices.reduce((sum, s) => sum + Number(s.value), 0)

  const totalCosts = costsWithPaymentStatus?.reduce((sum, c) => sum + Number(c.value), 0) || 0

  const costsByCategory: Record<string, number> = {}
  costsWithPaymentStatus?.forEach((cost) => {
    const category = cost.category || "Outros" // Agrupa custos sem categoria em "Outros"
    costsByCategory[category] = (costsByCategory[category] || 0) + Number(cost.value)
  })

  const totalSalaries = employees?.reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0
  const totalRevenue = servicesRevenue
  const profit = totalRevenue - totalCosts

  const { data: employeePaymentsDetailed } = await supabase
    .from("employee_payments")
    .select("employee_id, proof_url, payment_date")
    .gte("payment_date", startDateStr)
    .lte("payment_date", endDateStr)

  const employeePaymentProofs = new Map<string, string>()
  employeePaymentsDetailed?.forEach((payment) => {
    if (payment.proof_url && payment.employee_id) {
      employeePaymentProofs.set(payment.employee_id, payment.proof_url)
    }
  })

  // CORREÇÃO 2: Lógica de data de pagamento do funcionário atualizada
  const employeePayments =
    employees
      ?.map((employee) => {
        const isPaidThisMonth = paidEmployeeIds.has(employee.id)

        let nextPaymentDateFormatted = null
        
        // --- INÍCIO DA CORREÇÃO ---
        // Usa o payment_day do funcionário; se não houver, fica null
        if (employee.payment_day) {
          const paymentDay = employee.payment_day // Usa o dia específico do funcionário
          let nextPaymentDate = new Date(currentYear, currentMonth, paymentDay)

          // Lógica robusta (baseada na página da equipe):
          // Se a data de pagamento deste mês já passou, avança para o próximo mês
          if (today.getTime() > nextPaymentDate.getTime()) {
            nextPaymentDate = addMonths(nextPaymentDate, 1)
          }

          nextPaymentDateFormatted = format(nextPaymentDate, "dd/MM/yyyy", { locale: ptBR })
        }
        // --- FIM DA CORREÇÃO ---

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          salary: Number(employee.salary || 0),
          isPaidThisMonth,
          nextPaymentDate: nextPaymentDateFormatted, // Agora usa a data correta
          proofUrl: employeePaymentProofs.get(employee.id) || null,
        }
      })
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName)) || []

  return {
    services,
    costs: costsWithPaymentStatus,
    employees: employees || [],
    servicesRevenue,
    totalRevenue,
    totalCosts,
    costsByCategory,
    totalSalaries,
    profit,
    period,
    clientPayments: clientPayments || [],
    contractsReceived,
    contractsPending,
    salariesPaid,
    salariesPending,
    otherCostsPaid,
    otherCostsPending,
    employeePayments, // Adicionar aos dados retornados
  }
}

// Componente principal da página
export default async function FinancialPage({
  searchParams,
}: {
  searchParams: { period?: string } // Define o tipo dos parâmetros de busca
}) {
  const period = searchParams.period || "month" // Pega o período da URL ou usa 'month' como padrão
  const data = await getFinancialData(period) // Busca os dados financeiros

  return (
    <div className="space-y-6">
      {" "}
      {/* Espaçamento entre os elementos */}
      {/* Cabeçalho da página e botões de ação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gestão completa de receitas e custos</p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector currentPeriod={period} /> {/* Seletor de período */}
          <AddCostDialog employees={data.employees} /> {/* Botão para adicionar custo */}
        </div>
      </div>
      {/* --- Cards de Resumo (substituídos pelos novos cards detalhados) --- */}
      <FinancialSummaryCards
        contractsReceived={data.contractsReceived}
        contractsPending={data.contractsPending}
        servicesRevenue={data.servicesRevenue}
        salariesPaid={data.salariesPaid}
        salariesPending={data.salariesPending}
        otherCostsPaid={data.otherCostsPaid}
        otherCostsPending={data.otherCostsPending}
      />
      {/* --- Gráficos Financeiros (sem alteração aqui) --- */}
      <FinancialCharts costs={data.costs || []} costsByCategory={data.costsByCategory} />
      {/* --- Abas - Adicionada "Pagamentos de Clientes" --- */}
      <Tabs defaultValue="costs" className="space-y-4">
        {" "}
        {/* Define 'costs' como aba padrão */}
        {/* Lista de abas (gatilhos) - agora com 5 colunas */}
        <TabsList className="grid w-full grid-cols-5">
          {/* Gatilho da nova aba */}
          <TabsTrigger value="clientPayments">
            <Users className="mr-2 h-4 w-4" /> Pagamentos de Clientes
          </TabsTrigger>
          <TabsTrigger value="employeePayments">
            <Users className="mr-2 h-4 w-4" /> Pagamentos de Funcionários
          </TabsTrigger>
          <TabsTrigger value="costs">Custos Detalhados</TabsTrigger>
          <TabsTrigger value="services">Serviços Pontuais</TabsTrigger>
          <TabsTrigger value="analysis">Análise por Categoria</TabsTrigger>
        </TabsList>
        {/* --- Conteúdo da Nova Aba de Pagamentos de Clientes --- */}
        <TabsContent value="clientPayments">
          {/* Renderiza a nova tabela de pagamentos */}
          <ClientPaymentsTable clientPayments={data.clientPayments} />
        </TabsContent>
        {/* --- Fim do Conteúdo da Nova Aba --- */}
        {/* --- Conteúdo da Nova Aba de Pagamentos de Funcionários --- */}
        <TabsContent value="employeePayments">
          {/* Renderiza a nova tabela de pagamentos de funcionários */}
          <EmployeePaymentsTable employeePayments={data.employeePayments} />
        </TabsContent>
        {/* --- Fim do Conteúdo da Nova Aba --- */}
        {/* Conteúdo da Aba de Custos */}
        <TabsContent value="costs">
          <FinancialTable costs={data.costs || []} /> {/* Tabela de custos detalhados */}
        </TabsContent>
        {/* Conteúdo da Aba de Serviços Pontuais */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Pontuais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Verifica se há serviços para listar */}
                {data.services && data.services.length > 0 ? (
                  // Mapeia e exibe cada serviço
                  data.services.map((service: any) => (
                    <div key={service.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.clients?.name}</p> {/* Nome do cliente */}
                        <p className="text-xs text-muted-foreground">
                          {new Date(service.date).toLocaleDateString("pt-BR")} {/* Data formatada */}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.value)}{" "}
                          {/* Valor formatado */}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {/* Status do serviço */}
                          {service.status === "completed"
                            ? "Concluído"
                            : service.status === "pending"
                              ? "Pendente"
                              : "Cancelado"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Mensagem exibida se não houver serviços
                  <p className="text-center text-muted-foreground py-8">Nenhum serviço pontual no período</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Conteúdo da Aba de Análise por Categoria */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Verifica se há categorias para listar */}
                {Object.entries(data.costsByCategory).length > 0 ? (
                  // Mapeia e exibe cada categoria e seu valor total
                  Object.entries(data.costsByCategory)
                    .sort(([, a], [, b]) => b - a) // Ordena por valor (maior primeiro)
                    .map(([category, value]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category}</p>
                          <p className="text-sm text-muted-foreground">
                            {/* Calcula a porcentagem do total */}
                            {data.totalCosts > 0 ? ((value / data.totalCosts) * 100).toFixed(1) : 0}% do total
                          </p>
                        </div>
                        <p className="text-lg font-bold">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}{" "}
                          {/* Valor formatado */}
                        </p>
                      </div>
                    ))
                ) : (
                  // Mensagem exibida se não houver custos
                  <p className="text-center text-muted-foreground py-8">Nenhum custo registrado no período</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
