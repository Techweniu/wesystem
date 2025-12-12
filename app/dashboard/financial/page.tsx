import { createAdminClient } from "@/lib/supabase/server" // Admin Client
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, ExternalLink, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { AddCostDialog } from "@/components/add-cost-dialog"
import { FinancialTable } from "@/components/financial-table"
import { FinancialCharts } from "@/components/financial-charts"
import { PeriodSelector } from "@/components/period-selector"
import { ClientPaymentsTable } from "@/components/client-payments-table"
import { FinancialSummaryCards } from "@/components/financial-summary-cards"
import { EmployeePaymentsTable } from "@/components/employee-payments-table"
import { GeneralInflowsTable } from "@/components/general-inflows-table"
import { GeneralOutflowsTable } from "@/components/general-outflows-table"
import { parseISO, format, startOfMonth, endOfMonth, subDays, startOfYear, endOfYear, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MarkServiceReceivedButton } from "@/components/mark-service-received-button"
import { cookies } from "next/headers"
import { formatCurrency } from "@/lib/utils"

// CONFIGURAÇÃO DE CACHE:
export const dynamic = "force-dynamic"
export const revalidate = 0

// --- HELPER DE DATA SEGURO ---
const safeFormatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    // Formata YYYY-MM-DD para DD/MM/YYYY na marra, sem Date object
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

// Helper para converter DD/MM/YYYY para Date para ordenação
const parseBrDate = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return new Date(0);
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  return new Date(0);
}

// Função auxiliar para calcular o período
function getDateRange(period: string) {
  const today = new Date()
  let start = startOfMonth(today)
  let end = endOfMonth(today)

  if (period === "week") {
    start = subDays(today, 7)
    end = today
  } else if (period === "quarter") {
    start = subDays(today, 90)
    end = today
  } else if (period === "year") {
    start = startOfYear(today)
    end = endOfYear(today)
  }

  return { 
    start: start.toISOString(), 
    end: end.toISOString(),
    startObj: start,
    endObj: end
  }
}

async function getFinancialData(period: string) {
  const supabase = createAdminClient()
  const { start, end, startObj, endObj } = getDateRange(period)

  const [
    costsInRangeResult,
    allPendingCostsResult,
    oneTimeServicesResult,
    clientPaymentsResult,
    employeePaymentsResult,
    activeContractsResult,
    activeEmployeesResult,
    costCategoriesResult
  ] = await Promise.all([
    supabase.from("costs").select("*").gte("date", start).lte("date", end).order("date", { ascending: false }),
    supabase.from("costs").select("*").eq("status", "pending").order("date", { ascending: true }),
    supabase.from("one_time_services").select("*, clients(name)").gte("date", start).lte("date", end).order("date", { ascending: false }),
    supabase.from("client_payments").select("*, clients(name)").gte("payment_date", start).lte("payment_date", end).order("payment_date", { ascending: false }),
    supabase.from("employee_payments").select("*, employees(name)").gte("payment_date", start).lte("payment_date", end).order("payment_date", { ascending: false }),
    supabase.from("contracts").select("id, name, valor_mensal, client_id, clients(name)").eq("status", "active"),
    supabase.from("employees").select("id, name, salary, payment_day").eq("status", "active"),
    supabase.from("cost_categories").select("*").order("name")
  ])

  // Lógica Cumulativa de Custos
  const safeCostsMap = new Map()
  costsInRangeResult.data?.forEach(c => safeCostsMap.set(c.id, c))
  allPendingCostsResult.data?.forEach(c => safeCostsMap.set(c.id, c))
  
  const safeCosts = Array.from(safeCostsMap.values()).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const safeServices = oneTimeServicesResult.data || []
  const safeClientPayments = clientPaymentsResult.data || []
  const safeEmployeePayments = employeePaymentsResult.data || []
  const safeContracts = activeContractsResult.data || []
  const safeEmployees = activeEmployeesResult.data || []

  // KPIs
  const contractsReceived = safeClientPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalMrrExpected = safeContracts.reduce((sum, c) => sum + Number(c.valor_mensal), 0)
  const contractsPending = Math.max(0, totalMrrExpected - contractsReceived)

  const servicesRevenue = safeServices
    .filter(s => s.status === 'completed' || s.received_date)
    .reduce((sum, s) => sum + Number(s.value), 0)
  const servicesPending = safeServices
    .filter(s => s.status === 'pending' && !s.received_date)
    .reduce((sum, s) => sum + Number(s.value), 0)

  const salariesPaid = safeEmployeePayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalSalariesExpected = safeEmployees.reduce((sum, e) => sum + Number(e.salary), 0)
  const salariesPending = Math.max(0, totalSalariesExpected - salariesPaid)

  const costsForKpi = safeCosts.filter(c => c.date >= start && c.date <= end)
  const otherCostsPaid = costsForKpi.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.value), 0)
  const otherCostsPending = costsForKpi.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.value), 0)

  const costsByCategory: Record<string, number> = {}
  costsForKpi.forEach(c => {
    const cat = c.category || 'Outros'
    costsByCategory[cat] = (costsByCategory[cat] || 0) + Number(c.value)
  })
  if (salariesPaid + salariesPending > 0) {
    costsByCategory['Salários'] = salariesPaid + salariesPending
  }

  // --- LÓGICA DE CLIENTES ---
  const clientPaymentsData = [] as any[]
  safeClientPayments.forEach(payment => {
    clientPaymentsData.push({
      uniqueKey: payment.id,
      clientId: payment.client_id,
      clientName: payment.clients?.name || "Cliente Desconhecido",
      amount: Number(payment.amount),
      date: safeFormatDate(payment.payment_date), 
      status: 'paid',
      proofUrl: payment.proof_url
    })
  })
  safeContracts.forEach(contract => {
    const paidThisMonth = safeClientPayments.some(p => p.client_id === contract.client_id)
    const today = new Date()
    let nextDate = new Date(today.getFullYear(), today.getMonth(), 10)
    if (paidThisMonth) nextDate = addMonths(nextDate, 1)

    clientPaymentsData.push({
      uniqueKey: `${contract.client_id}-pending`,
      clientId: contract.client_id,
      clientName: contract.clients?.name || "Cliente Desconhecido",
      amount: Number(contract.valor_mensal),
      date: format(nextDate, "dd/MM/yyyy"), 
      status: 'pending',
      proofUrl: null
    })
  })
  clientPaymentsData.sort((a, b) => a.clientName.localeCompare(b.clientName) || (a.status === 'pending' ? 1 : -1))

  // --- LÓGICA DE FUNCIONÁRIOS ---
  const employeePaymentsData = [] as any[]
  safeEmployeePayments.forEach(payment => {
    employeePaymentsData.push({
      uniqueKey: payment.id,
      employeeId: payment.employee_id,
      employeeName: payment.employees?.name || "Colaborador",
      amount: Number(payment.amount),
      date: safeFormatDate(payment.payment_date), 
      status: 'paid',
      proofUrl: payment.proof_url
    })
  })
  safeEmployees.forEach(emp => {
    const paidThisMonth = safeEmployeePayments.some(p => p.employee_id === emp.id)
    if (emp.payment_day) {
        const today = new Date()
        let nextDate = new Date(today.getFullYear(), today.getMonth(), emp.payment_day)
        if (paidThisMonth) nextDate = addMonths(nextDate, 1)
        
        employeePaymentsData.push({
          uniqueKey: `${emp.id}-pending`,
          employeeId: emp.id,
          employeeName: emp.name,
          amount: Number(emp.salary),
          date: format(nextDate, "dd/MM/yyyy"),
          status: 'pending',
          proofUrl: null
        })
    }
  })
  employeePaymentsData.sort((a, b) => {
     if (a.employeeName === b.employeeName) return a.status === 'pending' ? -1 : 1
     return a.employeeName.localeCompare(b.employeeName)
  })

  // --- CONSTRUÇÃO DAS TABELAS GERAIS ---

  // 1. Entradas Gerais (Contratos + Serviços)
  const generalInflows = [
    ...clientPaymentsData.map((p: any) => ({
      id: p.uniqueKey,
      description: p.clientName,
      category: "Contrato (MRR)",
      date: p.date,
      amount: p.amount,
      status: p.status,
      rawDate: parseBrDate(p.date)
    })),
    ...safeServices.map((s) => ({
      id: s.id,
      description: s.clients?.name || "Serviço Avulso",
      category: "Serviço Pontual",
      date: safeFormatDate(s.date),
      amount: Number(s.value),
      status: s.received_date ? 'completed' : s.status,
      rawDate: new Date(s.date)
    }))
  ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())

  // 2. Saídas Gerais (Custos + Folha)
  const generalOutflows = [
    ...safeCosts.map((c) => ({
      id: c.id,
      description: c.description,
      category: c.category,
      date: safeFormatDate(c.date),
      amount: Number(c.value),
      status: c.status,
      rawDate: new Date(c.date)
    })),
    ...employeePaymentsData.map((e: any) => ({
      id: e.uniqueKey,
      description: `Salário: ${e.employeeName}`,
      category: "Folha de Pagamento",
      date: e.date,
      amount: e.amount,
      status: e.status,
      rawDate: parseBrDate(e.date)
    }))
  ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())

  const totalCosts = salariesPaid + salariesPending + otherCostsPaid + otherCostsPending

  return {
    contractsReceived,
    contractsPending,
    servicesRevenue,
    servicesPending,
    salariesPaid,
    salariesPending,
    otherCostsPaid,
    otherCostsPending,
    totalCosts,
    costs: safeCosts, 
    costsByCategory,
    clientPayments: clientPaymentsData,
    employeePayments: employeePaymentsData,
    services: safeServices,
    employees: safeEmployees,
    costCategories: costCategoriesResult.data || [],
    generalInflows,
    generalOutflows
  }
}

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const period = searchParams.period || "month"
  const rawData = await getFinancialData(period)
  
  const userRole = cookies().get("user_role")?.value
  const isLimited = userRole === "limited"

  // SECURITY: Sanitiza os dados se o usuário for limitado.
  const data = isLimited ? {
    ...rawData,
    contractsReceived: 0,
    contractsPending: 0,
    servicesRevenue: 0,
    servicesPending: 0,
    salariesPaid: 0,
    salariesPending: 0,
    otherCostsPaid: 0,
    otherCostsPending: 0,
    totalCosts: 0,
    costs: rawData.costs.map(c => ({ ...c, value: 0 })),
    services: rawData.services.map(s => ({ ...s, value: 0 })),
    employeePayments: rawData.employeePayments.map(e => ({ ...e, amount: 0 })),
    clientPayments: rawData.clientPayments.map(c => ({ ...c, amount: 0 })),
    generalInflows: rawData.generalInflows.map(i => ({ ...i, amount: 0 })),
    generalOutflows: rawData.generalOutflows.map(o => ({ ...o, amount: 0 })),
  } : rawData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gestão completa de receitas e custos</p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector currentPeriod={period} />
          {!isLimited && (
            <AddCostDialog employees={data.employees} costCategories={data.costCategories} />
          )}
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
        userRole={userRole as "admin" | "limited" | null}
      />
      
      <FinancialCharts costs={data.costs} costsByCategory={data.costsByCategory} />
      
      <Tabs defaultValue="inflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
          <TabsTrigger value="inflows" className="gap-2"><ArrowUpCircle className="h-4 w-4" /> Entradas Gerais</TabsTrigger>
          <TabsTrigger value="outflows" className="gap-2"><ArrowDownCircle className="h-4 w-4" /> Saídas Gerais</TabsTrigger>
          <TabsTrigger value="clientPayments"><Users className="mr-2 h-4 w-4" /> Clientes</TabsTrigger>
          <TabsTrigger value="employeePayments"><Users className="mr-2 h-4 w-4" /> Equipe</TabsTrigger>
          <TabsTrigger value="costs">Custos</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inflows">
          <GeneralInflowsTable data={data.generalInflows} />
        </TabsContent>

        <TabsContent value="outflows">
          <GeneralOutflowsTable data={data.generalOutflows} />
        </TabsContent>

        <TabsContent value="clientPayments">
          <ClientPaymentsTable clientPayments={data.clientPayments} />
        </TabsContent>
        
        <TabsContent value="employeePayments">
          <EmployeePaymentsTable employeePayments={data.employeePayments} />
        </TabsContent>
        
        <TabsContent value="costs">
          {/* O componente FinancialTable agora cuida da formatação */}
          <FinancialTable costs={data.costs} userRole={userRole as "admin" | "limited" | null} />
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
                          <TableCell>{safeFormatDate(service.date)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(service.value, isLimited)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={service.received_date ? "default" : "secondary"}>
                              {service.received_date ? "Recebido" : "Aguardando"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {!isLimited && (
                              <MarkServiceReceivedButton
                                serviceId={service.id}
                                clientId={service.client_id}
                                expectedAmount={service.value}
                                isReceived={!!service.received_date}
                              />
                            )}
                            {isLimited && <span className="text-muted-foreground text-xs">Acesso restrito</span>}
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
                              <span className="text-sm text-muted-foreground">-</span>
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
        
      </Tabs>
    </div>
  )
}
