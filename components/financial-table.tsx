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
import { FileText, Trash2 } from "lucide-react"
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

// --- FUNÇÃO DE FORMATAÇÃO SEGURA ---
// Recebe "YYYY-MM-DD" e retorna "DD/MM/YYYY" sem alterar fuso horário
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

export function FinancialTable({ costs, userRole }: FinancialTableProps) {
  const handleDelete = async (id: string) => {
    const result = await deleteCost(id)
    if (result.success) {
      toast.success("Custo deletado com sucesso!")
    } else {
      toast.error(result.error || "Erro ao deletar custo.")
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Ações</TableHead>
            <TableHead className="text-center">Comprovantes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.length > 0 ? (
            costs.map((cost) => (
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
  )
}
