"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { markPaymentAsPaid, undoEmployeePayment } from "@/app/dashboard/team/actions"

interface MarkPaymentButtonProps {
  employeeId: string
  salary: number
  isPaidThisMonth: boolean
}

export function MarkPaymentButton({ employeeId, salary, isPaidThisMonth }: MarkPaymentButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handlePayment = () => {
    const formData = new FormData()
    formData.append("employeeId", employeeId)
    formData.append("amount", String(salary))

    startTransition(async () => {
      const result = await markPaymentAsPaid(formData)
      if (result.error) {
        toast.error("Erro ao registrar pagamento", { description: result.error })
      } else {
        toast.success(result.success)
      }
    })
  }

  const handleUndo = () => {
    if (!confirm("Tem certeza que deseja reverter este pagamento?")) {
      return
    }

    const formData = new FormData()
    formData.append("employeeId", employeeId)

    startTransition(async () => {
      const result = await undoEmployeePayment(formData)
      if (result.error) {
        toast.error("Erro ao reverter pagamento", { description: result.error })
      } else {
        toast.success(result.success)
      }
    })
  }
  // </CHANGE>

  if (isPaidThisMonth) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span>Pago</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          disabled={isPending}
          className="h-8 px-2 text-muted-foreground hover:text-destructive"
          title="Reverter pagamento"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        {/* </CHANGE> */}
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={handlePayment} disabled={isPending || salary <= 0}>
      {isPending ? "Registrando..." : "Marcar como Pago"}
    </Button>
  )
}
