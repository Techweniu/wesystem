"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MarkPaymentButton } from "./mark-payment-button"
import { FileText, ExternalLink } from "lucide-react"

interface EmployeePaymentItem {
  uniqueKey: string
  employeeId: string
  employeeName: string
  amount: number
  date: string // Data do pagamento ou vencimento
  status: 'paid' | 'pending'
  proofUrl?: string | null
}

interface EmployeePaymentsTableProps {
  employeePayments: EmployeePaymentItem[]
}

export function EmployeePaymentsTable({ employeePayments }: EmployeePaymentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Folha de Pagamento (Histórico e Previsão)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Data (Ref.)</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center w-[180px]">Ação</TableHead>
                <TableHead className="text-center">Comprovante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeePayments.length > 0 ? (
                employeePayments.map((item) => (
                  <TableRow key={item.uniqueKey}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/team/${item.employeeId}`} className="hover:underline">
                        {item.employeeName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {item.date}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.status === 'paid' ? "default" : "secondary"}>
                        {item.status === 'paid' ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <MarkPaymentButton
                        employeeId={item.employeeId}
                        salary={item.amount}
                        isPaidThisMonth={item.status === 'paid'}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {item.proofUrl ? (
                        <Button variant="ghost" size="sm" asChild className="gap-2">
                          <a href={item.proofUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                            Ver comprovante
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado.
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
