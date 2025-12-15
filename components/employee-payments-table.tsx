"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { MarkPaymentButton } from "./mark-payment-button"
import { FileText, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react"
import { useState, useMemo } from "react"

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

type SortConfig = {
  key: keyof EmployeePaymentItem;
  direction: 'asc' | 'desc';
} | null;

// Helper para converter DD/MM/YYYY para timestamp para ordenação
const parseBrDateToTimestamp = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return 0;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
  }
  return 0;
}

export function EmployeePaymentsTable({ employeePayments }: EmployeePaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  const handleSort = (key: keyof EmployeePaymentItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const processedData = useMemo(() => {
    let filtered = [...employeePayments];

    // 1. Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.employeeName.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        // Custom sort for date string "DD/MM/YYYY"
        if (sortConfig.key === 'date') {
            aValue = parseBrDateToTimestamp(a.date);
            bValue = parseBrDateToTimestamp(b.date);
        }

        if (aValue === bValue) return 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [employeePayments, searchTerm, sortConfig]);

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
      : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Folha de Pagamento (Histórico e Previsão)</CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrar por nome do funcionário..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                   className="cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => handleSort('employeeName')}
                >
                  <div className="flex items-center">Funcionário {renderSortIcon('employeeName')}</div>
                </TableHead>
                <TableHead 
                   className="cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">Data (Ref.) {renderSortIcon('date')}</div>
                </TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('amount')}
                >
                   <div className="flex items-center justify-end">Valor {renderSortIcon('amount')}</div>
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('status')}
                >
                   <div className="flex items-center justify-center">Status {renderSortIcon('status')}</div>
                </TableHead>
                <TableHead className="text-center w-[180px]">Ação</TableHead>
                <TableHead className="text-center">Comprovante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.length > 0 ? (
                processedData.map((item) => (
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
