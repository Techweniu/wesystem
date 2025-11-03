"use client"

import { useState, useTransition } from "react"
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
import { CheckCircle, CircleDollarSign, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { markClientPaymentAsPaid, undoClientPayment } from "@/app/dashboard/financial/actions"

interface MarkClientPaymentButtonProps {
  clientId: string
  expectedAmount: number
  isPaidThisMonth: boolean
}

export function MarkClientPaymentButton({ clientId, expectedAmount, isPaidThisMonth }: MarkClientPaymentButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [showDialog, setShowDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handlePayment = () => {
    if (!selectedFile) {
      toast.error("Por favor, anexe o comprovante de recebimento")
      return
    }

    const formData = new FormData()
    formData.append("clientId", clientId)
    formData.append("amount", String(expectedAmount))
    formData.append("proof_file", selectedFile)

    startTransition(async () => {
      const result = await markClientPaymentAsPaid(formData)
      if (result.error) {
        toast.error("Erro ao registrar pagamento", { description: result.error })
      } else {
        toast.success(result.success)
        setShowDialog(false)
        setSelectedFile(null)
      }
    })
  }

  const handleUndo = () => {
    if (!confirm("Tem certeza que deseja reverter este recebimento?")) {
      return
    }

    const formData = new FormData()
    formData.append("clientId", clientId)

    startTransition(async () => {
      const result = await undoClientPayment(formData)
      if (result.error) {
        toast.error("Erro ao reverter recebimento", { description: result.error })
      } else {
        toast.success(result.success)
      }
    })
  }

  if (isPaidThisMonth) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 text-sm text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span>Recebido</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          disabled={isPending}
          className="h-8 px-2 text-muted-foreground hover:text-destructive"
          title="Reverter recebimento"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDialog(true)}
        disabled={isPending || expectedAmount <= 0}
        className="gap-1 bg-transparent"
      >
        <CircleDollarSign className="h-4 w-4" />
        Marcar Recebido
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              Anexe o comprovante de recebimento de{" "}
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expectedAmount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proof_file">Comprovante de Recebimento *</Label>
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
            <Button onClick={handlePayment} disabled={isPending || !selectedFile}>
              {isPending ? "Registrando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
