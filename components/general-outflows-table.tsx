"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface OutflowItem {
  id: string
  description: string
  category: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
}

interface GeneralOutflowsTableProps {
  data: OutflowItem[]
}

export function GeneralOutflowsTable({ data }: GeneralOutflowsTableProps) {
  const statusMap = {
    paid: { label: "Pago", variant: "default" },
    pending: { label: "Pendente", variant: "secondary" },
    overdue: { label: "Atrasado", variant: "destructive" },
    cancelled: { label: "Cancelado", variant: "outline" },
  } as const

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saídas Gerais (Custos + Folha de Pagamento)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, idx) => (
                  <TableRow key={`${item.id}-${idx}`}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusMap[item.status]?.variant || "outline"}>
                        {statusMap[item.status]?.label || item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhuma saída encontrada no período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
