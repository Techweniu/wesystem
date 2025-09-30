import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

async function getFinancialData() {
  const supabase = await createClient()

  // Get all contracts
  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })

  // Get all one-time services
  const { data: services } = await supabase
    .from("one_time_services")
    .select("*, clients(name)")
    .order("date", { ascending: false })

  // Get all costs
  const { data: costs } = await supabase.from("costs").select("*").order("date", { ascending: false })

  // Calculate totals
  const activeContracts = contracts?.filter((c) => c.status === "active") || []
  const monthlyRevenue = activeContracts.reduce((sum, c) => sum + Number(c.monthly_value), 0)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const completedServices = services?.filter((s) => s.status === "completed" && s.date.startsWith(currentMonth)) || []
  const servicesRevenue = completedServices.reduce((sum, s) => sum + Number(s.value), 0)

  const monthlyCosts = costs?.filter((c) => c.date.startsWith(currentMonth)) || []
  const totalCosts = monthlyCosts.reduce((sum, c) => sum + Number(c.value), 0)

  const totalRevenue = monthlyRevenue + servicesRevenue
  const profit = totalRevenue - totalCosts

  return {
    contracts,
    services,
    costs,
    monthlyRevenue,
    servicesRevenue,
    totalRevenue,
    totalCosts,
    profit,
  }
}

export default async function FinancialPage() {
  const data = await getFinancialData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">Gestão de receitas e custos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Receita recorrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem: {data.totalRevenue > 0 ? ((data.profit / data.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="services">Serviços Pontuais</TabsTrigger>
          <TabsTrigger value="costs">Custos</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead className="text-right">Valor Mensal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.contracts?.map((contract: any) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.clients?.name}</TableCell>
                      <TableCell>{contract.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            contract.status === "active"
                              ? "default"
                              : contract.status === "completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {contract.status === "active"
                            ? "Ativo"
                            : contract.status === "completed"
                              ? "Concluído"
                              : "Cancelado"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(contract.start_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(contract.monthly_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Pontuais</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.services?.map((service: any) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.clients?.name}</TableCell>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            service.status === "completed"
                              ? "default"
                              : service.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {service.status === "completed"
                            ? "Concluído"
                            : service.status === "pending"
                              ? "Pendente"
                              : "Cancelado"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(service.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(service.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Custos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.costs?.map((cost: any) => (
                    <TableRow key={cost.id}>
                      <TableCell className="font-medium">{cost.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{cost.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cost.is_recurring ? "default" : "secondary"}>
                          {cost.is_recurring ? "Recorrente" : "Pontual"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(cost.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(cost.value)}
                      </TableCell>
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
