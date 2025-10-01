import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { AddClientForm } from "@/components/add-client-form"
import { Toaster } from "@/components/ui/sonner"
import { differenceInDays, isPast, parseISO } from 'date-fns'

async function getClients() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from("clients")
    .select(
      `
      *,
      contracts (id, monthly_value, status, start_date, end_date)
    `
    )
    .order("name")

  const today = new Date()

  return clients?.map((client) => {
    // Assumindo um único contrato ativo por cliente
    const activeContract = client.contracts?.find((c: { status: string }) => c.status === "active")

    let daysRemaining = null;
    let generatedValue = 0;

    if (activeContract) {
      const startDate = parseISO(activeContract.start_date);
      
      // Cálculo de Dias Restantes
      if (activeContract.end_date) {
        const endDate = parseISO(activeContract.end_date);
        if (isPast(endDate)) {
          daysRemaining = -1; // Sinaliza que expirou
        } else {
          daysRemaining = differenceInDays(endDate, today);
        }
      }

      // Cálculo do Valor Gerado
      const dailyValue = activeContract.monthly_value / 30.44; // Média de dias no mês
      const daysPassed = differenceInDays(today, startDate);
      if (daysPassed > 0) {
        generatedValue = dailyValue * daysPassed;
      }
    }

    return {
      ...client,
      monthlyRevenue: activeContract?.monthly_value || 0,
      daysRemaining,
      generatedValue,
    }
  })
}

export default async function ClientsPage() {
  const clients = await getClients()

  const renderRemainingDays = (days: number | null) => {
    if (days === null) {
      return <span className="text-muted-foreground">Indeterm.</span>;
    }
    if (days < 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (days <= 30) {
        return <Badge variant="secondary">{days} dias</Badge>;
    }
    return <span className="text-muted-foreground">{days} dias</span>;
  }

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
                <TableHead>Dias Restantes</TableHead>
                <TableHead className="text-right">Receita Mensal</TableHead>
                <TableHead className="text-right">Valor Gerado (Est.)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell><Badge variant={client.status === "active" ? "default" : client.status === "prospect" ? "secondary" : "outline"}>{client.status === "active" ? "Ativo" : client.status === "prospect" ? "Prospect" : "Inativo"}</Badge></TableCell>
                  <TableCell>{renderRemainingDays(client.daysRemaining)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.monthlyRevenue)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.generatedValue)}</TableCell>
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
