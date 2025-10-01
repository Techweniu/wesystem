import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getTopClients() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from("clients")
    .select(
      `
      id,
      name,
      one_time_services (value, status)
    `,
    )
    .eq("status", "active")

  const clientsWithRevenue = clients?.map((client) => {
    const revenue =
      client.one_time_services
      ?.filter((s: { status: string }) => s.status === 'completed')
      .reduce((sum: number, s: { value: number }) => sum + Number(s.value), 0) || 0
    return {
      name: client.name,
      revenue,
    }
  })

  return clientsWithRevenue?.sort((a, b) => b.revenue - a.revenue).slice(0, 5)
}

export async function TopClientsTable() {
  const clients = await getTopClients()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Clientes por Receita (Serviços Pontuais)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Receita Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients?.map((client) => (
              <TableRow key={client.name}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(client.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
