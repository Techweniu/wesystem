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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { FileText, Receipt } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OutflowItem {
  id: string
  description: string
  category: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  invoiceUrl?: string | null // Nota Fiscal
  receiptUrl?: string | null // Comprovante Bancário
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
                <TableHead className="text-center">Nota</TableHead>
                <TableHead className="text-center">Pgto</TableHead>
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
                    
                    {/* Coluna Nota Fiscal */}
                    <TableCell className="text-center">
                      {item.invoiceUrl ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-blue-600">
                                <a href={item.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4" />
                                  <span className="sr-only">Nota</span>
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver Nota Fiscal</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </TableCell>

                    {/* Coluna Comprovante de Pagamento */}
                    <TableCell className="text-center">
                      {item.receiptUrl ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-green-600">
                                <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer">
                                  <Receipt className="h-4 w-4" />
                                  <span className="sr-only">Comprovante</span>
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver Comprovante</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
