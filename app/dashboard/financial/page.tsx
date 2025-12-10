import { createAdminClient } from "@/lib/supabase/server" // Admin Client
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
import { parseISO, format, startOfMonth, endOfMonth, subDays, startOfYear, endOfYear } from "date-fns"
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
// force-dynamic: Impede geração estática no build
// revalidate = 0: Garante que o cache seja invalidado imediatamente a cada request
export const dynamic = "force-dynamic"
export const revalidate = 0

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
  const supabase = createAdminClient() // Busca com privilégios
  const { start, end, startObj, endObj } = getDateRange(period)

  // 1. Buscar Dados em Paralelo
  const [
    { data: costs },
    { data: oneTimeServices },
    { data: clientPayments },
    { data: employeePayments },
    { data: activeContracts },
    { data: activeEmployees },
    { data: costCategories }
  ] = await Promise.all([
    supabase.from("costs").select("*").gte("date", start).lte("date", end).order("date", { ascending: false }),
    supabase.from("one_time_services").select("*, clients(name)").gte("date", start).lte("date", end).order("date", { ascending: false }),
    supabase.from("client_payments").select("*, clients(name)").gte("payment_date", start).lte("payment_date", end).order("payment_date", { ascending: false }),
    supabase.from("employee_payments").select("*, employees(name)").gte("payment_date", start).lte("payment_date", end).order("payment_date", { ascending: false }),
    supabase.from("contracts").select("id, name, valor_mensal, client_id, clients(name)").eq("status", "active"),
    supabase.from("employees").select("id, name, salary, payment_day").eq("status", "active"),
    supabase.from("cost_categories").select("*").order("name")
  ])

  const safeCosts = costs || []
  const safeServices = oneTimeServices || []
  const safeClientPayments = clientPayments || []
  const safeEmployeePayments = employeePayments || []
  const safeContracts = activeContracts || []
  const safeEmployees = activeEmployees || []

  // --- CÁLCULOS DE RECEITA ---
  const contractsReceived = safeClientPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalMrrExpected = safeContracts.reduce((sum, c) => sum + Number(c.valor_mensal), 0)
  const contractsPending = Math.max(0, totalMrrExpected - contractsReceived)

  const servicesRevenue = safeServices
    .filter(s => s.status === 'completed' || s.received_date)
    .reduce((sum, s) => sum + Number(s.value), 0)
  
  const servicesPending = safeServices
    .filter(s => s.status === 'pending' && !s.received_date)
    .reduce((sum, s) => sum + Number(s.value), 0)

  // --- CÁLCULOS DE CUSTOS ---
  const salariesPaid = safeEmployeePayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalSalariesExpected = safeEmployees.reduce((sum, e) => sum + Number(e.salary), 0)
  const salariesPending = Math.max(0, totalSalariesExpected - salariesPaid)

  const otherCostsPaid = safeCosts
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.value), 0)
  
  const otherCostsPending = safeCosts
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.value), 0)

  // --- PREPARAÇÃO PARA TABELAS E GRÁFICOS ---
  const costsByCategory: Record<string, number> = {}
  safeCosts.forEach(c => {
    const cat = c.category || 'Outros'
    costsByCategory[cat] = (costsByCategory[cat] || 0) + Number(c.value)
  })
  if (salariesPaid + salariesPending > 0) {
    costsByCategory['Salários'] = salariesPaid + salariesPending
  }

  const clientPaymentsData = safeContracts.map(contract => {
    const payment = safeClientPayments.find(p => p.client_id === contract.client_id)
    const isPaid = !!payment
    const today = new Date()
    let nextDate = new Date(today.getFullYear(), today.getMonth(), 10)
    if (isPaid) {
       nextDate.setMonth(nextDate.getMonth() + 1)
    }
    
    return {
      clientId: contract.client_id,
      clientName: contract.clients?.name || "Cliente Desconhecido",
      expectedAmount: contract.valor_mensal,
      isPaidThisMonth: isPaid,
      nextPaymentDate: format(nextDate, "dd/MM/yyyy"),
      activeContracts: [{ id: contract.id, name: contract.name }],
      proofUrl: payment?.proof_url
    }
  })

  const uniqueClientPaymentsMap = new Map()
  clientPaymentsData.forEach(item => {
    if (uniqueClientPaymentsMap.has(item.clientId)) {
      const existing = uniqueClientPaymentsMap.get(item.clientId)
      existing.expectedAmount += item.expectedAmount
      existing.activeContracts.push(...item.activeContracts)
      existing.isPaidThisMonth = existing.isPaidThisMonth || item.isPaidThisMonth 
      if (item.proofUrl) existing.proofUrl = item.proofUrl
    } else {
      uniqueClientPaymentsMap.set(item.clientId, item)
    }
  })
  const uniqueClientPayments = Array.from(uniqueClientPaymentsMap.values())

  const employeePaymentsData = safeEmployees.map(emp => {
    const payment = safeEmployeePayments.find(p => p.employee_id === emp.id)
    const isPaid = !!payment
    
    let nextDate = null
    if (emp.payment_day) {
        const today = new Date()
        nextDate = new Date(today.getFullYear(), today.getMonth(), emp.payment_day)
        if (isPaid) nextDate.setMonth(nextDate.getMonth() + 1)
    }

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      salary: emp.salary,
      isPaidThisMonth: isPaid,
      nextPaymentDate: nextDate ? format(nextDate, "dd/MM/yyyy") : "Não definido",
      proofUrl: payment?.proof_url
    }
  })

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
    clientPayments: uniqueClientPayments,
    employeePayments: employeePaymentsData,
    services: safeServices,
    employees: safeEmployees,
    costCategories: costCategories || []
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
  // Isso garante que os valores reais NÃO sejam enviados ao navegador.
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
    costs: rawData.costs.map(c => ({ ...c, value: 0 })), // Zera valores individuais
    services: rawData.services.map(s => ({ ...s, value: 0 })), // Zera valores de serviços
    // Se precisar sanitizar outros arrays, faça aqui
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
      
      {/* Se quiser esconder os gráficos para limited, pode fazer renderização condicional aqui */}
      <FinancialCharts costs={data.costs} costsByCategory={data.costsByCategory} />
      
      <Tabs defaultValue="costs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="clientPayments"><Users className="mr-2 h-4 w-4" /> Pagamentos de Clientes</TabsTrigger>
          <TabsTrigger value="employeePayments"><Users className="mr-2 h-4 w-4" /> Pagamentos de Funcionários</TabsTrigger>
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
                          <TableCell>{format(parseISO(service.date), "dd/MM/yyyy")}</TableCell>
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
            <CardHeader><CardTitle>Análise por Categoria (Incluindo Salários)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.costsByCategory).length > 0 ? (
                  Object.entries(data.costsByCategory).sort(([, a], [, b]) => b - a).map(([category, value]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div><p className="font-medium">{category}</p><p className="text-sm text-muted-foreground">{data.totalCosts > 0 ? ((value / data.totalCosts) * 100).toFixed(1) : 0}% do total</p></div>
                        <p className="text-lg font-bold">{formatCurrency(value, isLimited)}</p>
                      </div>
                    ))
                ) : (<p className="text-center text-muted-foreground py-8">Nenhum custo registrado no período</p>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
