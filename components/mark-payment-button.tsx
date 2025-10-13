"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { markPaymentAsPaid } from "@/app/dashboard/team/actions"

interface MarkPaymentButtonProps {
  employeeId: string;
  salary: number;
  isPaidThisMonth: boolean;
}

export function MarkPaymentButton({ employeeId, salary, isPaidThisMonth }: MarkPaymentButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handlePayment = () => {
    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('amount', String(salary));

    startTransition(async () => {
      const result = await markPaymentAsPaid(formData);
      if (result.error) {
        toast.error("Erro ao registrar pagamento", { description: result.error });
      } else {
        toast.success(result.success);
      }
    });
  };

  if (isPaidThisMonth) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-500">
        <CheckCircle className="h-4 w-4" />
        <span>Pago</span>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handlePayment}
      disabled={isPending || salary <= 0}
    >
      {isPending ? "Registrando..." : "Marcar como Pago"}
    </Button>
  )
}
