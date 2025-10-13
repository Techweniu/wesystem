import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, DollarSign, PlusCircle, MoreHorizontal, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditEmployeeForm } from "@/components/edit-employee-form"
import { differenceInDays, parseISO, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MarkPaymentButton } from "@/components/mark-payment-button"
import { EmployeeObservationsDialog } from "@/components/employee-observations-dialog"
import { TeamTableRow } from "./team-table-row" // Importaremos um novo componente

async function getTeamData() {
  const supabase = await createClient()
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();

  const { data: employees, error } = await supabase
    .from("employees")
    .select(`*, manager:manager_id(name), employee_payments(amount, payment_date), employee_observations(*)`)
    .order("name")
    .order('created_at', { foreignTable: 'employee_observations', ascending: false });

  if (error) {
    console.error("Erro ao buscar dados da equipe:", error)
    return { employees: [], totalPaid: 0, activeEmployees: 0, totalSalary: 0 }
  }
  
  const employeesWithCalculations = employees?.map((emp) => {
    const hireDate = parseISO(emp.hire_date);
    const daysSinceHire = differenceInDays(today, hireDate);
    const totalCostGenerated = emp.salary ? (emp.salary / 30.44) * (daysSinceHire > 0 ? daysSinceHire : 0) : 0;
    const totalPaid = emp.employee_payments.reduce((sum, p) => sum + Number(p.amount), 0);

    let daysUntilPayment = null;
    let nextPaymentDateFormatted = null;

    if(emp.payment_day) {
        let nextPaymentDate = new Date(currentYear, currentMonth, emp.payment_day);
        if (today.getTime() > nextPaymentDate.getTime()) {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }
        daysUntilPayment = differenceInDays(nextPaymentDate, today);
        nextPaymentDateFormatted = format(nextPaymentDate, "dd/MM/yyyy - EEEE", { locale: ptBR });
    }

    const isPaidThisMonth = emp.employee_payments.some(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    return { ...emp, totalCostGenerated, totalPaid, daysUntilPayment, nextPaymentDateFormatted, isPaidThisMonth };
  })

  const activeEmployees = employees?.filter((e) => e.status === "active").length || 0
  const totalSalary = employees?.filter((e) => e.status === "active").reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0
  const totalPaid = employeesWithCalculations?.reduce((sum, e) => sum + e.totalPaid, 0) || 0;

  return { employees: employeesWithCalculations, totalPaid, activeEmployees, totalSalary };
}

export default async function TeamPage() {
  const data = await getTeamData();
  const allEmployees = data.employees || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Gestão de colaboradores e pagamentos</p>
        </div>
        {/* O formulário de adicionar novo continua funcionando da mesma forma */}
        <EditEmployeeForm allEmployees={allEmployees} open={false} onOpenChange={() => {}}>
           <Button><PlusCircle className="mr-2 h-4 w-4" />Adicionar Colaborador</Button>
        </EditEmployeeForm>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Cards de resumo... */}
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Colaboradores</CardTitle></CardHeader>
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
                <TableHead>Pagamento (Mês)</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-[50px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allEmployees.map((employee) => (
                <TeamTableRow key={employee.id} employee={employee} allEmployees={allEmployees} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
