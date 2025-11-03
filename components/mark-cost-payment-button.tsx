"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Undo2, Loader2 } from "lucide-react"
import { markCostAsPaid, undoCostPayment } from "@/app/dashboard/financial/actions"
import { toast } from "sonner"

interface MarkCostPaymentButtonProps {
  costId: string
  amount: number
  isPaid: boolean
}

export function MarkCostPaymentButton({ costId, amount, isPaid }: MarkCostPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function handleMarkAsPaid() {
    if (!selectedFile) {
      toast.error("Por favor, anexe o comprovante de pagamento")
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("costId", costId)
    formData.append("amount", amount.toString())
    formData.append("proof_file", selectedFile)

    const result = await markCostAsPaid(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success || "Pagamento registrado!")
      setShowDialog(false)
      setSelectedFile(null)
    }
    setIsLoading(false)
  }

  async function handleUndo() {
    if (!confirm("Tem certeza que deseja reverter este pagamento?")) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append("costId", costId)

    const result = await undoCostPayment(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success || "Pagamento revertido!")
    }
    setIsLoading(false)
  }

  if (isPaid) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600 dark:text-green-400 font-medium">Pago</span>
        <Button variant="ghost" size="icon" onClick={handleUndo} disabled={isLoading} className="h-8 w-8">
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
        onClick={() => setShowDialog(true)}
        disabled={isLoading}
        className="gap-2 bg-transparent"
      >
        <Check className="h-4 w-4" />
        Marcar como Pago
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Anexe o comprovante de pagamento de{" "}
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              {selectedFile && (
                <p className="text-sm text-muted-foreground">Arquivo selecionado: {selectedFile.name}</p>
              )}
              <p className="text-xs text-muted-foreground">Formatos aceitos: PDF, JPG, PNG (máx. 10MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkAsPaid} disabled={isLoading || !selectedFile}>
              {isLoading ? "Registrando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
