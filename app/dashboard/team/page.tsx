import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, DollarSign, PlusCircle, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditEmployeeForm } from "@/components/edit-employee-form"
import { differenceInDays, parseISO, format, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TeamTableRow } from "./team-table-row"
import { TeamFilters } from "@/components/team-filters"

// CONFIGURAÇÃO DE CACHE:
// Força a página a ser dinâmica e não usar cache estático.
// Isso garante que os dados exibidos sejam sempre os atuais do banco.
export const dynamic = "force-dynamic"
export const revalidate = 0

async function getTeamData({ name, status }: { name?: string; status?: string }) {
  const supabase = await createClient()
  const today = new Date()
  const todayNormalized = startOfDay(today) // Normaliza para 00:00:00
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const { data: allEmployeesData } = await supabase
    .from("employees")
    .select("status, salary, employee_payments(amount)")

  let query = supabase
    .from("employees")
    .select(
      `*, manager:manager_id(name), employee_payments(amount, payment_date), employee_observations(*), career_plan_expiration_date`,
    )
    .order("name")
    .order("created_at", { foreignTable: "employee_observations", ascending: false })

  if (name) {
    query = query.ilike("name", `%${name}%`)
  }
  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data: employees, error } = await query

  if (error) {
    console.error("Erro ao buscar dados da equipe:", error)
    return { employees: [], totalPaid: 0, activeEmployees: 0, totalSalary: 0 }
  }

  const employeesWithCalculations = employees?.map((emp) => {
    const hireDate = parseISO(emp.hire_date)
    const daysSinceHire = differenceInDays(today, hireDate)
    const totalCostGenerated = emp.salary ? (emp.salary / 30.44) * (daysSinceHire > 0 ? daysSinceHire : 0) : 0
    const totalPaid = emp.employee_payments.reduce((sum, p) => sum + Number(p.amount), 0)
    let daysUntilPayment = null
    let nextPaymentDateFormatted = null
    
    if (emp.payment_day) {
      const nextPaymentDate = new Date(currentYear, currentMonth, emp.payment_day)
      
      // Usa data normalizada para comparação, evitando pular o dia atual se o script rodar à tarde
      if (todayNormalized.getTime() > nextPaymentDate.getTime()) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
      }
      
      // Usa data normalizada para cálculo exato de dias de calendário
      daysUntilPayment = differenceInDays(nextPaymentDate, todayNormalized)
      nextPaymentDateFormatted = format(nextPaymentDate, "dd/MM/yyyy - EEEE", { locale: ptBR })
    }

    const isPaidThisMonth = emp.employee_payments.some((p) => {
      const paymentDate = new Date(p.payment_date)
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
    })
    return { ...emp, totalCostGenerated, totalPaid, daysUntilPayment, nextPaymentDateFormatted, isPaidThisMonth }
  })

  const activeEmployees = allEmployeesData?.filter((e) => e.status === "active").length || 0
  const totalSalary =
    allEmployeesData?.filter((e) => e.status === "active").reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0
  const totalPaid =
    allEmployeesData?.flatMap((e) => e.employee_payments).reduce((sum, p) => sum + Number(p.amount), 0) || 0

  return { employees: employeesWithCalculations, totalPaid, activeEmployees, totalSalary }
}

export default async function TeamPage({ searchParams }: { searchParams?: { name?: string; status?: string } }) {
  const { name, status } = searchParams || {}
  const data = await getTeamData({ name, status })
  const allEmployees = data.employees || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Gestão de colaboradores e pagamentos</p>
        </div>
        <EditEmployeeForm allEmployees={allEmployees}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Colaborador
          </Button>
        </EditEmployeeForm>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folha de Pagamento Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalSalary)}
            </div>
            <p className="text-xs text-muted-foreground">(ativos)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago (Histórico)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">Soma de todos os pagamentos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <TeamFilters />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Salário</TableHead>
                <TableHead className="text-right">Custo Gerado</TableHead>
                <TableHead>Dias Restantes</TableHead>
                <TableHead>Próximo Pagamento</TableHead>
                {/* <TableHead>Pagamento (Mês)</TableHead> <-- COLUNA REMOVIDA */}
                {/* A coluna "Observações" foi removida daqui */}
                <TableHead className="w-[50px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allEmployees.length > 0 ? (
                allEmployees.map((employee) => (
                  <TeamTableRow key={employee.id} employee={employee} allEmployees={allEmployees} />
                ))
              ) : (
                <TableRow>
                  {/* O colSpan foi ajustado para 7 */}
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum colaborador encontrado.
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
