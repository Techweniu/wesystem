"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { updateDeliverable } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Deliverable {
  id: string
  service_name: string
  delivered: boolean
  delivery_date: string | null
}

interface ContractDeliverablesChecklistProps {
  contractId: string
  clientId: string
  deliverables: Deliverable[]
}

export function ContractDeliverablesChecklist({
  contractId,
  clientId,
  deliverables,
}: ContractDeliverablesChecklistProps) {
  if (deliverables.length === 0) {
    return null
  }

  async function handleToggle(deliverableId: string, currentStatus: boolean) {
    const result = await updateDeliverable({
      deliverableId,
      clientId,
      delivered: !currentStatus,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Entregas Não Recorrentes:</p>
      {deliverables.map((deliverable) => (
        <div key={deliverable.id} className="flex items-start space-x-2">
          <Checkbox
            id={deliverable.id}
            checked={deliverable.delivered}
            onCheckedChange={() => handleToggle(deliverable.id, deliverable.delivered)}
          />
          <div className="grid gap-1 leading-none">
            <Label
              htmlFor={deliverable.id}
              className={`text-xs cursor-pointer ${deliverable.delivered ? "line-through text-muted-foreground" : ""}`}
            >
              {deliverable.service_name}
            </Label>
            {deliverable.delivered && deliverable.delivery_date && (
              <p className="text-[10px] text-muted-foreground">
                Entregue em {format(parseISO(deliverable.delivery_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
