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
      contracts (monthly_value)
    `,
    )
    .eq("status", "active")

  const clientsWithRevenue = clients?.map((client) => {
    const revenue =
      client.contracts?.reduce((sum: number, c: { monthly_value: number }) => sum + Number(c.monthly_value), 0) || 0
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
        <CardTitle>Top 5 Clientes por Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Receita Mensal</TableHead>
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
