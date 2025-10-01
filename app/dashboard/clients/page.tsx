import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { AddClientForm } from "@/components/add-client-form"
import { Toaster } from "@/components/ui/sonner"

async function getClients() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from("clients")
    .select(
      `
      *,
      contracts ( valor_mensal ), 
      one_time_services (value, status) 
    `
    )
    .order("name")

  return clients?.map((client) => {
    // Soma dos serviços pontuais concluídos
    const oneTimeValue = client.one_time_services
      ?.filter((s: { status: string }) => s.status === 'completed')
      .reduce((sum: number, s: { value: number }) => sum + Number(s.value), 0) || 0;
    
    // Soma da receita mensal de todos os contratos
    const monthlyRevenue = client.contracts
      ?.reduce((sum: number, c: { valor_mensal: number }) => sum + Number(c.valor_mensal), 0) || 0;

    return {
      ...client,
      oneTimeValue,
      monthlyRevenue,
      totalRevenue: monthlyRevenue + oneTimeValue,
    }
  })
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <Toaster richColors />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e contratos</p>
        </div>
        <AddClientForm />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total de Clientes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{clients?.length || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{clients?.filter((c) => c.status === "active").length || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Prospects</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{clients?.filter((c) => c.status === "prospect").length || 0}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Clientes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receita Mensal (MRR)</TableHead>
                <TableHead className="text-right">Serviços Pontuais</TableHead>
                <TableHead className="text-right">Receita Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell><Badge variant={client.status === "active" ? "default" : client.status === "prospect" ? "secondary" : "outline"}>{client.status === "active" ? "Ativo" : client.status === "prospect" ? "Prospect" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.monthlyRevenue)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.oneTimeValue)}</TableCell>
                  <TableCell className="text-right font-semibold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.totalRevenue)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/clients/${client.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
