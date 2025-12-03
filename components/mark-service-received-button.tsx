"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, CircleDollarSign, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { markServiceAsReceived, undoServiceReceipt } from "@/app/dashboard/financial/actions"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

interface MarkServiceReceivedButtonProps {
  serviceId: string
  clientId: string
  expectedAmount: number
  isReceived: boolean
}

export function MarkServiceReceivedButton({ serviceId, clientId, expectedAmount, isReceived }: MarkServiceReceivedButtonProps) {
  const userRole = useRole(); // --- ALTERAÇÃO
  const [isPending, startTransition] = useTransition()
  const [showDialog, setShowDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // --- ALTERAÇÃO ---
  if (userRole === "limited") {
    return isReceived
      ? <div className="flex items-center justify-center gap-2 text-sm text-green-500"><CheckCircle className="h-4 w-4" /> <span>Recebido</span></div>
      : <Button size="sm" variant="outline" disabled className="gap-1 bg-transparent opacity-50 cursor-not-allowed"><CircleDollarSign className="h-4 w-4" /> Marcar Recebido</Button>;
  }
  // ----------------

  const handlePayment = () => {
    if (!selectedFile) { toast.error("Anexe o comprovante"); return; }
    const formData = new FormData(); formData.append("serviceId", serviceId); formData.append("clientId", clientId); formData.append("amount", String(expectedAmount)); formData.append("proof_file", selectedFile);
    startTransition(async () => {
      const result = await markServiceAsReceived(formData)
      if (result.error) toast.error("Erro", { description: result.error })
      else { toast.success(result.success); setShowDialog(false); setSelectedFile(null); }
    })
  }

  const handleUndo = () => {
    if (!confirm("Reverter recebimento?")) return;
    const formData = new FormData(); formData.append("serviceId", serviceId); formData.append("clientId", clientId);
    startTransition(async () => {
      const result = await undoServiceReceipt(formData)
      if (result.error) toast.error("Erro", { description: result.error })
      else toast.success(result.success)
    })
  }

  if (isReceived) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 text-sm text-green-500"><CheckCircle className="h-4 w-4" /> <span>Recebido</span></div>
        <Button size="sm" variant="ghost" onClick={handleUndo} disabled={isPending} className="h-8 px-2 text-muted-foreground hover:text-destructive"><Undo2 className="h-4 w-4" /></Button>
      </div>
    )
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShowDialog(true)} disabled={isPending || expectedAmount <= 0} className="gap-1 bg-transparent"><CircleDollarSign className="h-4 w-4" /> Marcar Recebido</Button>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Recebimento</DialogTitle><DialogDescription>Anexe o comprovante.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4"><div className="space-y-2"><Label>Comprovante *</Label><Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button><Button onClick={handlePayment} disabled={isPending || !selectedFile}>Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
