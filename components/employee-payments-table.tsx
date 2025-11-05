"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MarkPaymentButton } from "./mark-payment-button"
import { FileText, ExternalLink } from "lucide-react"

interface EmployeePaymentInfo {
  employeeId: string
  employeeName: string
  salary: number
  isPaidThisMonth: boolean
  nextPaymentDate: string | null
  proofUrl?: string | null
}

interface EmployeePaymentsTableProps {
  employeePayments: EmployeePaymentInfo[]
}

export function EmployeePaymentsTable({ employeePayments }: EmployeePaymentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Pagamentos de Funcionários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Próximo Pagamento</TableHead>
                <TableHead className="text-right">Salário</TableHead>
                <TableHead className="text-center">Status (Mês Atual)</TableHead>
                <TableHead className="text-center w-[180px]">Ação</TableHead>
                <TableHead className="text-center">Comprovante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeePayments.length > 0 ? (
                employeePayments.map((payment) => (
                  <TableRow key={payment.employeeId}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/team/${payment.employeeId}`} className="hover:underline">
                        {payment.employeeName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {payment.nextPaymentDate || <span className="text-muted-foreground italic">Não definido</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payment.salary)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={payment.isPaidThisMonth ? "default" : "secondary"}>
                        {payment.isPaidThisMonth ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <MarkPaymentButton
                        employeeId={payment.employeeId}
                        employeeName={payment.employeeName}
                        salary={payment.salary}
                        isPaidThisMonth={payment.isPaidThisMonth}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {payment.proofUrl ? (
                        <Button variant="ghost" size="sm" asChild className="gap-2">
                          <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                            Ver comprovante
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sem comprovante</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum funcionário ativo encontrado.
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
