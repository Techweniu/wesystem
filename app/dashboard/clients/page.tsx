import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye, DollarSign, UserCheck, UserX } from "lucide-react"
import { AddClientForm } from "@/components/add-client-form"
import { Toaster } from "@/components/ui/sonner"
import { ClientFilters } from "@/components/client-filters"
import { NpsQuadrantChart } from "@/components/nps-quadrant-chart"
import { NpsScoreSummaryTable } from "@/components/nps-score-summary-table"

async function getClients({ name, status }: { name?: string; status?: string }) {
  const supabase = await createClient()
  let query = supabase
    .from("clients")
    .select(
      `
      *,
      contracts ( valor_mensal ), 
      one_time_services (value, status),
      nps_responses(score, response_date)
    `
    )
    .order("name")

  if (name) { query = query.ilike('name', `%${name}%`) }
  if (status && status !== 'all') { query = query.eq('status', status) }
  
  const { data: clients } = await query;

  return clients?.map((client) => {
    const oneTimeValue = client.one_time_services?.filter((s) => s.status === 'completed').reduce((sum, s) => sum + Number(s.value), 0) || 0;
    const monthlyRevenue = client.contracts?.reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0;
    
    const latestNps = client.nps_responses?.sort((a, b) => new Date(b.response_date).getTime() - new Date(a.response_date).getTime())[0]?.score;

    return { ...client, oneTimeValue, monthlyRevenue, totalRevenue: monthlyRevenue + oneTimeValue, latestNps }
  })
}

async function getAnalyticsData() {
    const supabase = await createClient();
    const { data: allContracts } = await supabase.from('contracts').select('valor_mensal, clients(status)');
    const monthlyRevenue = allContracts?.filter(c => c.clients?.status === 'active').reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0;
    
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: services } = await supabase.from("one_time_services").select("value").eq("status", "completed").gte("date", `${currentMonth}-01`)
    const oneTimeRevenue = services?.reduce((sum, s) => sum + Number(s.value), 0) || 0

    const { data: clientsData } = await supabase.from('clients').select(`name, contracts(valor_mensal), nps_responses(score, response_date)`).eq('status', 'active').order('response_date', { foreignTable: 'nps_responses', ascending: false });
    const npsChartData = clientsData?.map(client => {
        const latestNps = client.nps_responses[0]?.score;
        const clientMrr = client.contracts.reduce((sum, c) => sum + c.valor_mensal, 0);
        return { name: client.name, nps: latestNps, revenue: clientMrr };
    }).filter(c => c.nps !== undefined);

    return { monthlyRevenue, oneTimeRevenue, npsChartData };
}

export default async function ClientsPage({ searchParams }: { searchParams?: { name?: string; status?: string; }; }) {
  const { name, status } = searchParams || {};

  const [clients, analytics] = await Promise.all([
    getClients({ name, status }),
    getAnalyticsData()
  ]);

  // CORREÇÃO AQUI
  const supabase = await createClient();
  const { data: allClients } = await supabase.from("clients").select('status');
  
  const totalClients = allClients?.length || 0;
  const activeClients = allClients?.filter(c => c.status === 'active').length || 0;
  const inactiveClients = allClients?.filter(c => c.status === 'inactive').length || 0;
  const npsClientData = analytics.npsChartData.map(c => ({ name: c.name, nps: c.nps }));


  const healthStatusColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }

  return (
    <div className="space-y-6">
      <Toaster richColors />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie e analise sua base de clientes</p>
        </div>
        <AddClientForm />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(analytics.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              + {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(analytics.oneTimeRevenue)} em serviços pontuais no mês
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{activeClients}</div>
                 <p className="text-xs text-muted-foreground">de {totalClients} clientes no total</p>
            </CardContent>
        </Card>
        <div className="lg:col-span-1">
           <NpsScoreSummaryTable data={npsClientData || []} />
        </div>
      </div>
      
      <div>
         <NpsQuadrantChart data={analytics.npsChartData || []} />
      </div>

      <Card>
        <CardHeader>
            <ClientFilters />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Último NPS</TableHead>
                <TableHead className="text-right">Receita Mensal (MRR)</TableHead>
                <TableHead className="text-right">Receita Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients && clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <span className={`block w-2.5 h-2.5 rounded-full ${healthStatusColors[client.health_status] || 'bg-gray-500'}`} title={`Saúde: ${client.health_status}`}></span>
                    </TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell><Badge variant={client.status === "active" ? "default" : "outline"}>{client.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell className="text-center">
                      {client.latestNps !== undefined ? (
                        <Badge variant={client.latestNps >= 9 ? 'default' : client.latestNps >= 7 ? 'secondary' : 'destructive'}>{client.latestNps}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.monthlyRevenue)}</TableCell>
                    <TableCell className="text-right font-semibold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.totalRevenue)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum cliente encontrado.
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
