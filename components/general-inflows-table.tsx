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
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { FileText, Receipt, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useMemo } from "react"

interface InflowItem {
  id: string
  description: string
  category: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'completed' | 'cancelled'
  rawDate: Date
  invoiceUrl?: string | null // Nota Fiscal
  receiptUrl?: string | null // Comprovante Bancário
}

interface GeneralInflowsTableProps {
  data: InflowItem[]
}

type SortConfig = {
  key: keyof InflowItem;
  direction: 'asc' | 'desc';
} | null;

export function GeneralInflowsTable({ data }: GeneralInflowsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  const statusMap = {
    paid: { label: "Recebido", variant: "default" },
    completed: { label: "Recebido", variant: "default" },
    pending: { label: "Pendente", variant: "secondary" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  } as const

  const handleSort = (key: keyof InflowItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const processedData = useMemo(() => {
    let filtered = [...data];

    // 1. Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.description.toLowerCase().includes(lowerTerm) ||
        item.category.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Se estiver ordenando por 'date', usar 'rawDate' para precisão
        if (sortConfig.key === 'date') {
            aValue = a.rawDate.getTime();
            bValue = b.rawDate.getTime();
        }

        if (aValue === bValue) return 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
      : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entradas Gerais (Contratos + Serviços)</CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrar por descrição ou categoria..." 
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
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">Data {renderSortIcon('date')}</div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">Descrição {renderSortIcon('description')}</div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">Categoria {renderSortIcon('category')}</div>
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
                <TableHead className="text-center">Nota</TableHead>
                <TableHead className="text-center">Pgto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.length > 0 ? (
                processedData.map((item, idx) => (
                  <TableRow key={`${item.id}-${idx}`}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
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
                    Nenhuma entrada encontrada no período.
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
