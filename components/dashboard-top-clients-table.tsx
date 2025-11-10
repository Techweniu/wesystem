// Arquivo (NOVO): wesystem.v1/components/dashboard-top-clients-table.tsx
"use client" 
        
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ClientData {
  id: string;
  name: string;
  totalValue: number;
  mrr: number;
  oneTimeRevenueLast12M: number;
}

interface DashboardTopClientsTableProps {
  clients: ClientData[]
}

export function DashboardTopClientsTable({ clients }: DashboardTopClientsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Clientes por Valor Anualizado</CardTitle>
        <p className="text-sm text-muted-foreground">
          Valor calculado como (MRR * 12) + (Serviços Pontuais Recebidos nos últimos 12 meses).
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor Total (Ano)</TableHead>
              <TableHead className="text-right">MRR Atual</TableHead>
              <TableHead className="text-right">Serviços (12M)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length > 0 ? (
              clients.map((client, index) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Badge variant={index < 3 ? "default" : "outline"}>#{index + 1}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.totalValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.mrr)}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.oneTimeRevenueLast12M)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum dado de cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
