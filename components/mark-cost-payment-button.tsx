"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Undo2, Loader2, DollarSign } from "lucide-react"
import { markCostAsPaid, undoCostPayment } from "@/app/dashboard/financial/actions"
import { toast } from "sonner"
import { useRole } from "@/app/dashboard/layout"

interface MarkCostPaymentButtonProps {
  costId: string
  amount: number
  isPaid: boolean
}

export function MarkCostPaymentButton({ costId, amount, isPaid }: MarkCostPaymentButtonProps) {
  const userRole = useRole();
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // Estado para controlar o valor do pagamento (permite parciais)
  const [paymentValue, setPaymentValue] = useState<string>(amount.toString())

  // Formata moeda para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  // Se limitado, mostra apenas status texto
  if (userRole === "limited") {
    return isPaid 
      ? <span className="text-sm text-green-600 font-medium">Pago</span>
      : <span className="text-sm text-muted-foreground">Pendente</span>;
  }

  async function handleMarkAsPaid() {
    const valueToPay = parseFloat(paymentValue);

    if (isNaN(valueToPay) || valueToPay <= 0) {
      toast.error("Por favor, insira um valor de pagamento válido");
      return;
    }

    if (!selectedFile) {
      toast.error("Por favor, anexe o comprovante de pagamento")
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("costId", costId)
    // Envia o valor digitado pelo usuário, permitindo pagamentos parciais
    formData.append("amount", valueToPay.toString()) 
    formData.append("proof_file", selectedFile)

    const result = await markCostAsPaid(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else { 
      toast.success(result.success || "Pagamento registrado com sucesso!")
      setShowDialog(false)
      setSelectedFile(null)
      // Reseta o valor para o total original para a próxima vez, ou mantém
      setPaymentValue(amount.toString()) 
    }
    setIsLoading(false)
  }

  async function handleUndo() {
    if (!confirm("Tem certeza que deseja reverter os pagamentos deste custo?")) return
    setIsLoading(true)
    const formData = new FormData()
    formData.append("costId", costId)
    
    const result = await undoCostPayment(formData)
    
    if (result.error) toast.error(result.error)
    else toast.success(result.success || "Pagamento revertido!")
    setIsLoading(false)
  }

  if (isPaid) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600 dark:text-green-400 font-medium">Pago</span>
        <Button variant="ghost" size="icon" onClick={handleUndo} disabled={isLoading} className="h-8 w-8 text-muted-foreground hover:text-destructive">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          setPaymentValue(amount.toString()) // Reseta valor ao abrir
          setShowDialog(true)
        }} 
        disabled={isLoading} 
        className="gap-2 bg-transparent border-dashed"
      >
        <DollarSign className="h-3.5 w-3.5" /> 
        Registrar Pagamento
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Valor total do custo: {formatCurrency(amount)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment_value">Valor deste Pagamento (R$)</Label>
              <Input 
                id="payment_value" 
                type="number" 
                step="0.01" 
                min="0.01"
                value={paymentValue} 
                onChange={(e) => setPaymentValue(e.target.value)} 
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                Você pode registrar um valor parcial. O status mudará para "Pago" apenas quando o total for atingido.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof_file">Comprovante de Pagamento *</Label>
              <Input 
                id="proof_file" 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                required 
                className="cursor-pointer" 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleMarkAsPaid} disabled={isLoading || !selectedFile || !paymentValue}>
              {isLoading ? "Registrando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
