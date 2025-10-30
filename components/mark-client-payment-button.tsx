"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
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

  const handlePayment = () => {
    if (
      !confirm(
        `Confirma o recebimento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expectedAmount)}?`,
      )
    ) {
      return
    }

    const formData = new FormData()
    formData.append("clientId", clientId)
    formData.append("amount", String(expectedAmount))

    startTransition(async () => {
      const result = await markClientPaymentAsPaid(formData)
      if (result.error) {
        toast.error("Erro ao registrar pagamento", { description: result.error })
      } else {
        toast.success(result.success)
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
  // </CHANGE>

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
        {/* </CHANGE> */}
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handlePayment}
      disabled={isPending || expectedAmount <= 0}
      className="gap-1 bg-transparent"
    >
      {isPending ? (
        "Registrando..."
      ) : (
        <>
          <CircleDollarSign className="h-4 w-4" />
          Marcar Recebido
        </>
      )}
    </Button>
  )
}
