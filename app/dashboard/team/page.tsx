import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Clock, DollarSign } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getTeamData() {
  const supabase = await createClient()

  // Get all employees with their managers
  const { data: employees, error } = await supabase
    .from("employees")
    .select(
      `
      *,
      manager:manager_id(name) 
    `,
    )
    .order("name")

  if (error) {
    console.error("Erro ao buscar dados da equipe:", error)
    // Retorna um estado vazio ou lida com o erro como preferir
    return { employees: [], timeLogs: [], activeEmployees: 0, totalSalary: 0, totalHours: 0 }
  }


  // Get time logs for current month
  const currentMonth = new Date().toISOString().slice(0, 7)
  const { data: timeLogs } = await supabase
    .from("time_logs")
    .select(
      `
      *,
      employee:employees(name),
      client:clients(name)
    `,
    )
    .gte("date", `${currentMonth}-01`)
    .order("date", { ascending: false })

  // Calculate total hours per employee
  const employeeHours = new Map()
  timeLogs?.forEach((log: any) => {
    const current = employeeHours.get(log.employee_id) || 0
    employeeHours.set(log.employee_id, current + Number(log.hours))
  })

  const employeesWithHours = employees?.map((emp) => ({
    ...emp,
    monthlyHours: employeeHours.get(emp.id) || 0,
  }))

  const activeEmployees = employees?.filter((e) => e.status === "active").length || 0
  const totalSalary =
    employees?.filter((e) => e.status === "active").reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0
  const totalHours = Array.from(employeeHours.values()).reduce((sum: number, h: number) => sum + h, 0)

  return {
    employees: employeesWithHours,
    timeLogs,
    activeEmployees,
    totalSalary,
    totalHours,
  }
}

export default async function TeamPage() {
  const data = await getTeamData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
        <p className="text-muted-foreground">Gestão de colaboradores e alocação de tempo</p>
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
            <CardTitle className="text-sm font-medium">Folha de Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.totalSalary)}
            </div>
            <p className="text-xs text-muted-foreground">Mensal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Trabalhadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Colaboradores</TabsTrigger>
          <TabsTrigger value="timelogs">Registro de Horas</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Colaboradores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead className="text-right">Salário</TableHead>
                    <TableHead className="text-right">Horas (Mês)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.employees?.map((employee: any) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.department || "-"}</TableCell>
                      <TableCell>{employee.manager?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        {employee.salary
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(employee.salary)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">{employee.monthlyHours.toFixed(1)}h</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === "active" ? "default" : "outline"}>
                          {employee.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timelogs">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Horas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.timeLogs?.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{log.employee?.name}</TableCell>
                      <TableCell>{log.client?.name || "-"}</TableCell>
                      <TableCell className="max-w-md truncate">{log.description || "-"}</TableCell>
                      <TableCell className="text-right">{Number(log.hours).toFixed(1)}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
