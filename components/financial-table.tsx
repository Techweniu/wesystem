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
import { FileText, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react"
import { MarkCostPaymentButton } from "./mark-cost-payment-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteCost } from "@/app/dashboard/financial/actions"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { useState, useMemo } from "react"

// --- FUNÇÃO DE FORMATAÇÃO SEGURA ---
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return "-";
  const parts = dateString.split("T")[0].split("-");
  if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
  }
  return dateString;
}

interface Cost {
  id: string
  description: string
  value: number
  category: string
  date: string
  is_recurring: boolean
  status: "pending" | "paid" | "overdue"
  proof_url?: string | null
  payment_proof_url?: string | null
  paid_date?: string | null
}

interface FinancialTableProps {
  costs: Cost[]
  userRole?: "admin" | "limited" | null
}

type SortConfig = {
  key: keyof Cost | 'paid_date';
  direction: 'asc' | 'desc';
} | null;

export function FinancialTable({ costs, userRole }: FinancialTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  const handleDelete = async (id: string) => {
    const result = await deleteCost(id)
    if (result.success) {
      toast.success("Custo deletado com sucesso!")
    } else {
      toast.error(result.error || "Erro ao deletar custo.")
    }
  }

  const handleSort = (key: keyof Cost | 'paid_date') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const processedData = useMemo(() => {
    let data = [...costs];

    // 1. Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(item => 
        item.description.toLowerCase().includes(lowerTerm) ||
        item.category.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Sort
    if (sortConfig) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;
        
        // Handle null/undefined for dates
        if (aValue === null || aValue === undefined) return 1; 
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [costs, searchTerm, sortConfig]);

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
      : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  }

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filtrar por descrição ou categoria..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">Vencimento {renderSortIcon('date')}</div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('paid_date')}
              >
                <div className="flex items-center">Pagamento {renderSortIcon('paid_date')}</div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center justify-end">Valor {renderSortIcon('value')}</div>
              </TableHead>
              <TableHead 
                className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('status')}
              >
                 <div className="flex items-center justify-center">Status {renderSortIcon('status')}</div>
              </TableHead>
              <TableHead className="text-center">Ações</TableHead>
              <TableHead className="text-center">Comprovantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length > 0 ? (
              processedData.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">
                    {cost.description}
                    {cost.is_recurring && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Recorrente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{cost.category}</TableCell>
                  
                  <TableCell>{formatDateDisplay(cost.date)}</TableCell>
                  
                  <TableCell>
                    {cost.paid_date ? formatDateDisplay(cost.paid_date) : "-"}
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {formatCurrency(cost.value, userRole === "limited")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        cost.status === "paid"
                          ? "default"
                          : cost.status === "overdue"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {cost.status === "paid"
                        ? "Pago"
                        : cost.status === "overdue"
                        ? "Atrasado"
                        : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {userRole !== "limited" ? (
                      <div className="flex items-center justify-center gap-2">
                        <MarkCostPaymentButton
                          costId={cost.id}
                          amount={cost.value}
                          isPaid={cost.status === "paid"}
                        />
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o custo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cost.id)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Restrito</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1 items-center">
                      {cost.proof_url && (
                          <a href={cost.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:underline text-blue-600">
                              <FileText className="h-3 w-3" /> Nota
                          </a>
                      )}
                      {cost.payment_proof_url && (
                          <a href={cost.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:underline text-green-600">
                              <FileText className="h-3 w-3" /> Pagto
                          </a>
                      )}
                      {!cost.proof_url && !cost.payment_proof_url && <span className="text-muted-foreground text-xs">-</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Nenhum custo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
