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
import { parseISO, format, isPast, addMonths } from "date-fns"
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
    .select("*, client_id, clients(name), received_date, payment_proof_url")
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: false })

  const { data: costs } = await supabase
    .from("costs")
    .select("*, proof_url")
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: false })

  const costsWithPaymentStatus = costs?.map((cost) => ({
    ...cost,
    is_paid: !!cost.paid_date,
  }))

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, salary, payment_day")
    .eq("status", "active")
    .order("name")

  const { data: clientsWithContracts } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      status,
      contracts (id, name, valor_mensal, start_date, end_date, status),
      client_payments (amount, payment_date, contract_id)
    `)
    .eq("status", "active")
    .order("name")

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

  const contractsPending =
    activeContracts
      ?.filter((c) => {
        if (!isContractVigent(c)) return false
        const contractStart = c.start_date ? parseISO(c.start_date) : startDate
        const contractEnd = c.end_date ? parseISO(c.end_date) : endDate
        return contractStart <= endDate && contractEnd >= startDate
      })
      .reduce((sum, c) => sum + Number(c.valor_mensal || 0), 0) || 0

  const { data: employeePaymentsData } = await supabase
    .from("employee_payments")
    .select("amount, payment_date")
    .gte("payment_date", startDateStr)
    .lte("payment_date", endDateStr)

  const salariesPaid = employeePaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const { data: employeesWithPayments } = await supabase
    .from("employees")
    .select(`
      id,
      salary,
      employee_payments!inner(payment_date)
    `)
    .eq("status", "active")

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

  const salariesPending =
    employees?.filter((e) => !paidEmployeeIds.has(e.id)).reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0

  const otherCostsPaid =
    costsWithPaymentStatus?.filter((c) => c.is_paid).reduce((sum, c) => sum + Number(c.value), 0) || 0
  const otherCostsPending =
    costsWithPaymentStatus?.filter((c) => !c.is_paid).reduce((sum, c) => sum + Number(c.value), 0) || 0

  const completedServices = services?.filter((s) => s.received_date) || []
  const servicesRevenue = completedServices.reduce((sum, s) => sum + Number(s.value), 0)

  // +++ ADICIONADO: Calcular serviços pontuais pendentes +++
  const pendingServices = services?.filter((s) => !s.received_date) || []
  const servicesPending = pendingServices.reduce((sum, s) => sum + Number(s.value), 0)
  // +++ FIM DA ADIÇÃO +++

  const totalCosts = costsWithPaymentStatus?.reduce((sum, c) => sum + Number(c.value), 0) || 0

  const costsByCategory: Record<string, number> = {}
  costsWithPaymentStatus?.forEach((cost) => {
    const category = cost.category || "Outros"
    costsByCategory[category] = (costsByCategory[category] || 0) + Number(cost.value)
  })

  const totalSalaries = employees?.reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0
  
  // ATUALIZADO: totalRevenue agora é a soma de TUDO (recebido e pendente)
  const totalRevenue = contractsReceived + contractsPending + servicesRevenue + servicesPending
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

  return {
    services,
    costs: costsWithPaymentStatus,
    employees: employees || [],
    servicesRevenue, // Recebido pontual
    servicesPending, // <-- ADICIONADO
    totalRevenue,    // Total geral
    totalCosts,
    costsByCategory,
    totalSalaries,
    profit,
    period,
    clientPayments: clientPayments || [],
    contractsReceived, // Recebido contrato
    contractsPending,  // Pendente contrato
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
          <AddCostDialog employees={data.employees} />
        </div>
      </div>
      
      {/* ATUALIZAÇÃO: Passar o novo prop 'servicesPending' para os cards */}
      <FinancialSummaryCards
        contractsReceived={data.contractsReceived}
        contractsPending={data.contractsPending}
        servicesRevenue={data.servicesRevenue}
        servicesPending={data.servicesPending} // <-- ADICIONADO
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
              <CardTitle>Análise por Categoria</CardTitle>
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
