import { createAdminClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  User,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Home,
  FileText,
  ArrowLeft,
  Users,
  TrendingUp,
  Star,
} from "lucide-react"
import { differenceInDays, parseISO, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { EditEmployeeForm } from "@/components/edit-employee-form"
import { AddObservationForm } from "@/components/add-observation-form"
import { AddContributionForm } from "@/components/add-contribution-form"
import { CareerPlanExpirationBadge } from "@/components/career-plan-expiration-badge"
import { CareerPlanPanel } from "@/components/career-plan-panel" // Importando o novo componente

async function getEmployeeData(id: string) {
  const supabase = createAdminClient()

  const { data: employee, error } = await supabase
    .from("employees")
    .select(`
      *,
      manager:manager_id(id, name),
      employee_payments(id, amount, payment_date, proof_url),
      employee_observations(id, observation, tag, created_at),
      employee_contributions(id, description, category, value, date),
      employee_contracts(id, name, storage_path, created_at)
    `)
    .eq("id", id)
    .order("payment_date", { foreignTable: "employee_payments", ascending: false })
    .order("created_at", { foreignTable: "employee_observations", ascending: false })
    .order("date", { foreignTable: "employee_contributions", ascending: false })
    .single()

  if (error || !employee) {
    return null
  }

  // Get subordinates
  const { data: subordinates } = await supabase
    .from("employees")
    .select("id, name, role, status")
    .eq("manager_id", id)
    .eq("status", "active")

  // Get all employees for editing
  const { data: allEmployees } = await supabase.from("employees").select("id, name, role, status").order("name")

  const { data: assignedClients } = await supabase
    .from("clients")
    .select("id, name")
    .or(
      `assigned_assessor_id.eq.${id},assigned_editor_id.eq.${id},assigned_relationship_manager_id.eq.${id},assigned_videomaker_id.eq.${id}`,
    )

  const npsData: { averageNps: number | null; npsCount: number; clientsWithNps: any[] } = {
    averageNps: null,
    npsCount: 0,
    clientsWithNps: [],
  }

  if (assignedClients && assignedClients.length > 0) {
    const clientIds = assignedClients.map((c) => c.id)

    const { data: npsResponses } = await supabase
      .from("nps_responses")
      .select("score, client_id, response_date")
      .in("client_id", clientIds)
      .order("response_date", { ascending: false })

    if (npsResponses && npsResponses.length > 0) {
      const totalScore = npsResponses.reduce((sum, nps) => sum + nps.score, 0)
      npsData.averageNps = totalScore / npsResponses.length
      npsData.npsCount = npsResponses.length

      // Group NPS by client to show breakdown
      const clientNpsMap = new Map<string, { scores: number[]; clientName: string }>()
      for (const nps of npsResponses) {
        const client = assignedClients.find((c) => c.id === nps.client_id)
        if (!clientNpsMap.has(nps.client_id)) {
          clientNpsMap.set(nps.client_id, { scores: [], clientName: client?.name || "Cliente" })
        }
        clientNpsMap.get(nps.client_id)?.scores.push(nps.score)
      }

      npsData.clientsWithNps = Array.from(clientNpsMap.entries()).map(([clientId, data]) => ({
        clientId,
        clientName: data.clientName,
        averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        responseCount: data.scores.length,
      }))
    }
  }

  // Calculate metrics
  const today = new Date()
  const hireDate = parseISO(employee.hire_date)
  const daysSinceHire = differenceInDays(today, hireDate)
  const totalCostGenerated = employee.salary ? (employee.salary / 30.44) * (daysSinceHire > 0 ? daysSinceHire : 0) : 0
  const totalPaid = employee.employee_payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
  const totalContributions =
    employee.employee_contributions?.reduce((sum: number, c: any) => sum + Number(c.value), 0) || 0

  return {
    ...employee,
    daysSinceHire,
    totalCostGenerated,
    totalPaid,
    totalContributions,
    subordinates: subordinates || [],
    allEmployees: allEmployees || [],
    assignedClients: assignedClients || [],
    npsData,
  }
}

function getNpsColor(score: number): string {
  if (score >= 9) return "text-green-600"
  if (score >= 7) return "text-yellow-600"
  return "text-red-600"
}

function getNpsBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 9) return "default"
  if (score >= 7) return "secondary"
  return "destructive"
}

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const employee = await getEmployeeData(params.id)

  if (!employee) {
    notFound()
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/team">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
              <Badge variant={employee.status === "active" ? "default" : "outline"}>
                {employee.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
              {/* Mantemos o badge antigo no cabeçalho também para visibilidade imediata */}
              <CareerPlanExpirationBadge expirationDate={employee.career_plan_expiration_date} />
            </div>
            <p className="text-muted-foreground">
              {employee.role} • {employee.department}
            </p>
          </div>
        </div>
        <EditEmployeeForm employee={employee} allEmployees={employee.allEmployees}>
          <Button>Editar Colaborador</Button>
        </EditEmployeeForm>
      </div>

      {/* Summary Cards - Added NPS card */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salário Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(employee.salary || 0)}</div>
            <p className="text-xs text-muted-foreground">Dia de pagamento: {employee.payment_day || "Não definido"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total Gerado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(employee.totalCostGenerated)}</div>
            <p className="text-xs text-muted-foreground">{employee.daysSinceHire} dias desde contratação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(employee.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {employee.employee_payments?.length || 0} pagamentos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contribuições</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(employee.totalContributions)}</div>
            <p className="text-xs text-muted-foreground">
              {employee.employee_contributions?.length || 0} contribuições
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Médio</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {employee.npsData.averageNps !== null ? (
              <>
                <div className={`text-2xl font-bold ${getNpsColor(employee.npsData.averageNps)}`}>
                  {employee.npsData.averageNps.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {employee.npsData.npsCount} avaliações de {employee.assignedClients.length} cliente(s)
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-xs text-muted-foreground">
                  {employee.assignedClients.length > 0
                    ? `${employee.assignedClients.length} cliente(s), sem NPS`
                    : "Sem clientes vinculados"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{employee.email || "Não informado"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data de Contratação</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(employee.hire_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {employee.work_model === "home_office" ? (
                <Home className="h-4 w-4 text-blue-500" />
              ) : (
                <MapPin className="h-4 w-4 text-orange-500" />
              )}
              <div>
                <p className="text-sm font-medium">Modelo de Trabalho</p>
                <p className="text-sm text-muted-foreground">
                  {employee.work_model === "home_office" ? "Home Office" : "Presencial"}
                  {employee.office_location && ` • ${employee.office_location}`}
                </p>
              </div>
            </div>
            {employee.manager && (
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Gestor</p>
                  <Link
                    href={`/dashboard/team/${employee.manager.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {employee.manager.name}
                  </Link>
                </div>
              </div>
            )}
            {employee.career_plan_url && (
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Arquivo de Plano</p>
                  <a
                    href={employee.career_plan_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Ver PDF original
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="md:col-span-2">
          <Tabs defaultValue="observations" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="observations">Observações</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                <TabsTrigger value="contributions">Contribuições</TabsTrigger>
                <TabsTrigger value="clients">Clientes</TabsTrigger>
                <TabsTrigger value="subordinates">Subordinados</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              {/* [Conteúdo das Tabs mantido igual ao original, omitido aqui para brevidade pois não muda] */}
              <TabsContent value="observations" className="mt-0">
                <div className="flex justify-end mb-4">
                  <AddObservationForm employeeId={employee.id} />
                </div>
                {employee.employee_observations?.length > 0 ? (
                  <div className="space-y-3">
                    {employee.employee_observations.map((obs: any) => (
                      <div key={obs.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{obs.tag || "Geral"}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(obs.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm">{obs.observation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma observação registrada.</p>
                )}
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                {employee.employee_payments?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Comprovante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employee.employee_payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(parseISO(payment.payment_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="text-center">
                            {payment.proof_url ? (
                              <a
                                href={payment.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                Ver comprovante
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum pagamento registrado.</p>
                )}
              </TabsContent>

              <TabsContent value="contributions" className="mt-0">
                <div className="flex justify-end mb-4">
                  <AddContributionForm employeeId={employee.id} />
                </div>
                {employee.employee_contributions?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employee.employee_contributions.map((contrib: any) => (
                        <TableRow key={contrib.id}>
                          <TableCell className="font-medium">{contrib.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{contrib.category || "Geral"}</Badge>
                          </TableCell>
                          <TableCell>{format(parseISO(contrib.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(contrib.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma contribuição registrada.</p>
                )}
              </TabsContent>

              <TabsContent value="clients" className="mt-0">
                {employee.assignedClients?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-center">NPS Médio</TableHead>
                        <TableHead className="text-center">Avaliações</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employee.assignedClients.map((client: any) => {
                        const clientNps = employee.npsData.clientsWithNps.find((c: any) => c.clientId === client.id)
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className="text-center">
                              {clientNps ? (
                                <Badge variant={getNpsBadgeVariant(clientNps.averageScore)}>
                                  {clientNps.averageScore.toFixed(1)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{clientNps ? clientNps.responseCount : 0}</TableCell>
                            <TableCell className="text-right">
                              <Link href={`/dashboard/clients/${client.id}`}>
                                <Button variant="ghost" size="sm">
                                  Ver cliente
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum cliente vinculado a este colaborador.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="subordinates" className="mt-0">
                {employee.subordinates?.length > 0 ? (
                  <div className="grid gap-3">
                    {employee.subordinates.map((sub: any) => (
                      <Link
                        key={sub.id}
                        href={`/dashboard/team/${sub.id}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">{sub.role}</p>
                          </div>
                        </div>
                        <Badge variant={sub.status === "active" ? "default" : "outline"}>
                          {sub.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum subordinado direto.</p>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* PAINEL DE PLANO DE CARREIRA - NOVO */}
      <CareerPlanPanel 
        employeeId={employee.id}
        initialContent={employee.career_plan_content}
        initialGoals={employee.career_plan_goals || []}
        initialExpirationDate={employee.career_plan_expiration_date}
      />
    </div>
  )
}
