// ... (imports anteriores mantidos)
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
import { parseISO, format, isPast, addMonths, differenceInDays } from "date-fns" 
import { ptBR } from "date-fns/locale"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MarkServiceReceivedButton } from "@/components/mark-service-received-button"
// --- ALTERAÇÃO: Importar cookies ---
import { cookies } from "next/headers"
// ----------------------------------

// ... (função isContractVigent mantida)

// ... (função getFinancialData mantida - sem alterações necessárias nela)

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const period = searchParams.period || "month"
  const data = await getFinancialData(period) // Função deve estar definida no mesmo arquivo ou importada

  // --- ALTERAÇÃO: Verificar role no Server Component ---
  const userRole = cookies().get("user_role")?.value
  const isLimited = userRole === "limited"
  // ----------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gestão completa de receitas e custos</p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector currentPeriod={period} />
          {/* --- ALTERAÇÃO: Só mostra se NÃO for limitado --- */}
          {!isLimited && (
            <AddCostDialog employees={data.employees} costCategories={data.costCategories || []} />
          )}
          {/* ----------------------------------------------- */}
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
        {/* ... (TabsList mantido) ... */}
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
                            {/* O componente MarkServiceReceivedButton internamente verificará a permissão via useRole() */}
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
           {/* ... (Conteúdo de Análise mantido) */}
           <Card>
            <CardHeader><CardTitle>Análise por Categoria (Incluindo Salários)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.costsByCategory).length > 0 ? (
                  Object.entries(data.costsByCategory).sort(([, a], [, b]) => b - a).map(([category, value]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div><p className="font-medium">{category}</p><p className="text-sm text-muted-foreground">{data.totalCosts > 0 ? ((value / data.totalCosts) * 100).toFixed(1) : 0}% do total</p></div>
                        <p className="text-lg font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}</p>
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
