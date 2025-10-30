"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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

  async function handleMarkAsPaid() {
    setIsLoading(true)
    const formData = new FormData()
    formData.append("costId", costId)
    formData.append("amount", amount.toString())

    const result = await markCostAsPaid(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success || "Pagamento registrado!")
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAsPaid}
      disabled={isLoading}
      className="gap-2 bg-transparent"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      Marcar como Pago
    </Button>
  )
}
