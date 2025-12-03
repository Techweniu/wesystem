"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, CircleDollarSign, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { markClientPaymentAsPaid, undoClientPayment } from "@/app/dashboard/financial/actions"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

interface MarkClientPaymentButtonProps {
  clientId: string
  expectedAmount: number
  isPaidThisMonth: boolean
}

export function MarkClientPaymentButton({ clientId, expectedAmount, isPaidThisMonth }: MarkClientPaymentButtonProps) {
  const userRole = useRole(); // --- ALTERAÇÃO
  const [isPending, startTransition] = useTransition()
  const [showDialog, setShowDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // --- ALTERAÇÃO ---
  if (userRole === "limited") {
    return isPaidThisMonth 
      ? <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-4 w-4"/> Recebido</span>
      : <span className="text-sm text-muted-foreground">Pendente</span>;
  }
  // ----------------

  const handlePayment = () => {
    if (!selectedFile) { toast.error("Por favor, anexe o comprovante"); return; }
    const formData = new FormData()
    formData.append("clientId", clientId)
    formData.append("amount", String(expectedAmount))
    formData.append("proof_file", selectedFile)

    startTransition(async () => {
      const result = await markClientPaymentAsPaid(formData)
      if (result.error) toast.error("Erro", { description: result.error })
      else { toast.success(result.success); setShowDialog(false); setSelectedFile(null); }
    })
  }

  const handleUndo = () => {
    if (!confirm("Tem certeza que deseja reverter?")) return
    const formData = new FormData(); formData.append("clientId", clientId);
    startTransition(async () => {
      const result = await undoClientPayment(formData)
      if (result.error) toast.error("Erro", { description: result.error })
      else toast.success(result.success)
    })
  }

  if (isPaidThisMonth) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 text-sm text-green-500">
          <CheckCircle className="h-4 w-4" /> <span>Recebido</span>
        </div>
        <Button size="sm" variant="ghost" onClick={handleUndo} disabled={isPending} className="h-8 px-2 text-muted-foreground hover:text-destructive">
          <Undo2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShowDialog(true)} disabled={isPending || expectedAmount <= 0} className="gap-1 bg-transparent">
        <CircleDollarSign className="h-4 w-4" /> Marcar Recebido
      </Button>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Recebimento</DialogTitle><DialogDescription>Anexe o comprovante.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Comprovante *</Label><Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button><Button onClick={handlePayment} disabled={isPending || !selectedFile}>{isPending ? "Registrando..." : "Confirmar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
