// sistema/app/dashboard/financial/page.tsx
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, ExternalLink } from "lucide-react"
import { AddCostDialog } from "@/components/add-cost-dialog"
import { FinancialTable } from "@/components/financial-table"
import { FinancialCharts } from "@/components/financial-charts"
import { PeriodSelector } from "@/components/period-selector"
import { ClientPaymentsTable } from "@/components/client-payments-table"
import { FinancialSummaryCards } from "@/components/financial-summary-cards"
import { EmployeePaymentsTable } from "@/components/employee-payments-table"
import { parseISO, format, isPast, addMonths, differenceInDays } from "date-fns" // Adicionado differenceInDays
import { ptBR } from "date-fns/locale"
// Importar a nova tabela e componentes
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MarkServiceReceivedButton } from "@/components/mark-service-received-button"

// Função auxiliar (pode ser movida para utils se necessário)
const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true
  return hasStarted && hasNotEnded
}

async function getFinancialData(period = "month") {
  const supabase = await createClient()
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let startDate: Date
  let endDate: Date
  const isAllTime = period === "year"

  switch (period) {
    case "week":
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
      endDate = today
      break
    case "month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      break
    case "quarter":
      startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
      endDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0)
      break
    case "year": // "Anual" agora significa "All-Time"
      startDate = new Date(1970, 0, 1) // Data inicial bem antiga
      endDate = new Date(2100, 11, 31) // Data final bem no futuro
      break
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  }

  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  // --- 1. Queries (Data Fetching - Escopo de Período ou All-Time) ---

  let servicesQuery = supabase
    .from("one_time_services")
    .select("*, client_id, clients(name), received_date, payment_proof_url")
    .order("date", { ascending: false })
  if (!isAllTime) {
    servicesQuery = servicesQuery.gte("date", startDateStr).lte("date", endDateStr)
  }
  const { data: services } = await servicesQuery

  let costsQuery = supabase
    .from("costs")
    .select("*, proof_url")
    .order("date", { ascending: false })
  if (!isAllTime) {
    costsQuery = costsQuery.gte("date", startDateStr).lte("date", endDateStr)
  }
  const { data: costs } = await costsQuery

  let clientPaymentsQuery = supabase
    .from("client_payments")
    .select("amount, payment_date, proof_url, client_id")
  if (!isAllTime) {
    clientPaymentsQuery = clientPaymentsQuery.gte("payment_date", startDateStr).lte("payment_date", endDateStr)
  }
  const { data: clientPaymentsData } = await clientPaymentsQuery

  let employeePaymentsQuery = supabase
    .from("employee_payments")
    .select("amount, payment_date")
  if (!isAllTime) {
    employeePaymentsQuery = employeePaymentsQuery.gte("payment_date", startDateStr).lte("payment_date", endDateStr)
  }
  const { data: employeePaymentsData } = await employeePaymentsQuery

  // --- 2. Dados para Status Operacional (Sempre snapshot do MÊS ATUAL) ---
  const currentMonthStartDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const currentMonthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]

  const [employeesRes, clientsWithContractsRes, employeesWithPaymentsRes, employeePaymentsDetailedRes, clientPaymentsDetailedRes] = await Promise.all([
    supabase.from("employees").select("id, name, salary, payment_day").eq("status", "active").order("name"),
    supabase
      .from("clients")
      .select(`
        id,
        name,
        status,
        contracts (id, name, valor_mensal, start_date, end_date, status),
        client_payments (amount, payment_date, contract_id)
      `)
      .eq("status", "active")
      .order("name"),
    supabase
      .from("employees")
      .select(`id, salary, employee_payments!inner(payment_date)`)
      .eq("status", "active")
      .gte("employee_payments.payment_date", currentMonthStartDate)
      .lte("employee_payments.payment_date", currentMonthEndDate),
    supabase
      .from("employee_payments")
      .select("employee_id, proof_url, payment_date")
      .gte("payment_date", currentMonthStartDate) // Sempre do mês atual
      .lte("payment_date", currentMonthEndDate),
    supabase
      .from("client_payments")
      .select("amount, payment_date, proof_url, client_id")
      .gte("payment_date", currentMonthStartDate) // Sempre do mês atual
      .lte("payment_date", currentMonthEndDate)
  ]);

  const employees = employeesRes.data || []
  const clientsWithContracts = clientsWithContractsRes.data || []
  const employeesWithPayments = employeesWithPaymentsRes.data || []
  const employeePaymentsDetailed = employeePaymentsDetailedRes.data || []
  const clientPaymentsDetailed = clientPaymentsDetailedRes.data || []
  
  const { data: costCategories } = await supabase.from("cost_categories").select("id, name").order("name");


  // --- 3. Cálculos de Receita (LÓGICA ATUALIZADA) ---
  
  let contractsReceived: number
  let servicesRevenue: number
  let contractsPending: number
  let servicesPending: number

  if (isAllTime) {
    const { data: allClientsAndContracts } = await supabase
      .from("clients")
      .select(`id, created_at, contracts (name, valor_mensal, start_date)`)

    contractsReceived = 0
    allClientsAndContracts?.forEach(client => {
      client.contracts.forEach(contract => {
        if (contract.start_date && contract.valor_mensal && Number(contract.valor_mensal) > 0) {
          const startDate = parseISO(contract.start_date)
          const daysPassed = Math.max(0, differenceInDays(today, startDate) + 1)
          contractsReceived += (Number(contract.valor_mensal) / 30.44) * daysPassed
        }
      })
    })

    const completedServices = services?.filter((s) => s.status === 'completed' || s.received_date) || []
    servicesRevenue = completedServices.reduce((sum, s) => sum + Number(s.value), 0)

  } else {
    contractsReceived = clientPaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const completedServices = services?.filter((s) => s.received_date) || []
    servicesRevenue = completedServices.reduce((sum, s) => sum + Number(s.value), 0)
  }

  // --- 4. Cálculos de Pendências (Sempre Snapshot Atual) ---

  const { data: activeContracts } = await supabase
    .from("contracts")
    .select("valor_mensal, start_date, end_date")
    .eq("status", "active")
  contractsPending = activeContracts
      ?.filter((c) => isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal || 0), 0) || 0

  const pendingServices = services?.filter((s) => !s.received_date) || []
  servicesPending = pendingServices.reduce((sum, s) => sum + Number(s.value), 0)

  const paidEmployeeIds = new Set(employeesWithPayments?.map(e => e.id) || []);
  const salariesPending =
    employees?.filter((e) => !paidEmployeeIds.has(e.id)).reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0


  // --- 5. Cálculos de Custos (Escopo de data ou All-Time) ---
  
  const salariesPaid = employeePaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const costsWithPaymentStatus = costs?.map((cost) => ({
    ...cost,
    is_paid: !!cost.paid_date,
  }))
  const otherCostsPaid =
    costsWithPaymentStatus?.filter((c) => c.is_paid).reduce((sum, c) => sum + Number(c.value), 0) || 0
  const otherCostsPending =
    costsWithPaymentStatus?.filter((c) => !c.is_paid).reduce((sum, c) => sum + Number(c.value), 0) || 0


  // --- 6. Agregados Finais ---

  const totalGeralReceita = contractsReceived + servicesRevenue + contractsPending + servicesPending

  const costsByCategory: Record<string, number> = {}
  
  costsWithPaymentStatus?.forEach((cost) => {
    const category = cost.category || "Outros"
    costsByCategory[category] = (costsByCategory[category] || 0) + (Number(cost.value) || 0)
  })

  const totalSalaries = salariesPaid + salariesPending
  if (totalSalaries > 0) {
    costsByCategory["Salários"] = (costsByCategory["Salários"] || 0) + totalSalaries
  }

  const totalCosts = Object.values(costsByCategory).reduce((sum, v) => sum + v, 0)
  const profit = totalGeralReceita - totalCosts


  // --- 7. Dados para Tabela Operacional de Funcionários (Snapshot Mês Atual) ---
  
  const employeePaymentProofs = new Map<string, string>()
  employeePaymentsDetailed?.forEach((payment) => {
    if (payment.proof_url && payment.employee_id) {
      employeePaymentProofs.set(payment.employee_id, payment.proof_url)
    }
  })

  const employeePayments =
    employees
      ?.map((employee) => {
        const isPaidThisMonth = paidEmployeeIds.has(employee.id)
        let nextPaymentDateFormatted = null
        if (employee.payment_day) {
          const paymentDay = employee.payment_day
          let nextPaymentDate = new Date(currentYear, currentMonth, paymentDay)
          if (today.getTime() > nextPaymentDate.getTime()) {
            nextPaymentDate = addMonths(nextPaymentDate, 1)
          }
          nextPaymentDateFormatted = format(nextPaymentDate, "dd/MM/yyyy", { locale: ptBR })
        }
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          salary: Number(employee.salary || 0),
          isPaidThisMonth,
          nextPaymentDate: nextPaymentDateFormatted,
          proofUrl: employeePaymentProofs.get(employee.id) || null,
        }
      })
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName)) || []

  // --- 8. Dados para Tabela Operacional de Clientes (Snapshot Mês Atual) ---
  
  // --- CORREÇÃO: A variável clientPaymentProofs é declarada AQUI ---
  const clientPaymentProofs = new Map<string, string>()
  clientPaymentsDetailed?.forEach((payment) => {
    if (payment.proof_url && payment.client_id) {
      clientPaymentProofs.set(payment.client_id, payment.proof_url)
    }
  })
  // --- FIM DA CORREÇÃO ---

  const clientPayments = clientsWithContracts
    ?.map((client) => {
      const activeContracts = client.contracts.filter((c) => c.status === "active" && isContractVigent(c))
      const expectedMonthlyPayment = activeContracts.reduce((sum, c) => sum + Number(c.valor_mensal || 0), 0)

      const paymentThisMonth = client.client_payments.find((p) => {
        const paymentDate = parseISO(p.payment_date)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })
      const isPaidThisMonth = !!paymentThisMonth

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
        proofUrl: clientPaymentProofs.get(client.id) || null, // Agora usa o Map do escopo correto
      }
    })
    .filter((p) => p.expectedAmount > 0)
    .sort((a, b) => a.clientName.localeCompare(b.clientName))


  return {
    services,
    costs: costsWithPaymentStatus,
    employees: employees || [],
    costCategories: costCategories || [], // Retorna as categorias
    servicesRevenue,
    servicesPending,
    totalRevenue: totalGeralReceita,
    totalCosts,
    costsByCategory,
    totalSalaries: totalSalaries,
    profit,
    period,
    clientPayments: clientPayments || [],
    contractsReceived,
    contractsPending,
    salariesPaid,
    salariesPending,
    otherCostsPaid,
    otherCostsPending,
    employeePayments,
  }
}

// Componente principal da página
export default async function FinancialPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const period = searchParams.period || "month"
  const data = await getFinancialData(period)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gestão completa de receitas e custos</p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector currentPeriod={period} />
          <AddCostDialog employees={data.employees} costCategories={data.costCategories || []} />
        </div>
      </div>
      
      <FinancialSummaryCards
        contractsReceived={data.contractsReceived}
        contractsPending={data.contractsPending}
        servicesRevenue={data.servicesRevenue}
        servicesPending={data.servicesPending}
        salariesPaid={data.salariesPaid}
        salariesPending={data.salariesPending}
        otherCostsPaid={data.otherCostsPaid}
        otherCostsPending={data.otherCostsPending}
      />
      
      <FinancialCharts costs={data.costs || []} costsByCategory={data.costsByCategory} />
      
      <Tabs defaultValue="costs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
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
        
        <TabsContent value="clientPayments">
          <ClientPaymentsTable clientPayments={data.clientPayments} />
        </TabsContent>
        
        <TabsContent value="employeePayments">
          <EmployeePaymentsTable employeePayments={data.employeePayments} />
        </TabsContent>
        
        <TabsContent value="costs">
          <FinancialTable costs={data.costs || []} />
        </TabsContent>
        
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Recebimento de Serviços Pontuais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center w-[180px]">Ação</TableHead>
                      <TableHead className="text-center">Comprovante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.services && data.services.length > 0 ? (
                      data.services.map((service: any) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>
                            <Link href={`/dashboard/clients/${service.client_id}`} className="hover:underline">
                              {service.clients?.name || "Cliente não encontrado"}
                            </Link>
                          </TableCell>
                          <TableCell>{format(parseISO(service.date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-right font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(service.value)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={service.received_date ? "default" : "secondary"}>
                              {service.received_date ? "Recebido" : "Aguardando"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <MarkServiceReceivedButton
                              serviceId={service.id}
                              clientId={service.client_id}
                              expectedAmount={service.value}
                              isReceived={!!service.received_date}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {service.payment_proof_url ? (
                              <Button variant="ghost" size="sm" asChild className="gap-2">
                                <a href={service.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4" />
                                  Ver comprovante
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sem comprovante</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Nenhum serviço pontual encontrado no período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Categoria (Incluindo Salários)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.costsByCategory).length > 0 ? (
                  Object.entries(data.costsByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, value]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.totalCosts > 0 ? ((value / data.totalCosts) * 100).toFixed(1) : 0}% do total
                          </p>
                        </div>
                        <p className="text-lg font-bold">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}
                        </p>
                      </div>
                    ))
                ) : (
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
