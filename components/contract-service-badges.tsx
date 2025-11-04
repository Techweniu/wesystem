"use client"

import { Badge } from "@/components/ui/badge"
import { isNonRecurringService } from "@/lib/non-recurring-services"
import { toggleServiceDelivery } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { useState, useTransition } from "react"

interface Deliverable {
  id: string
  service_name: string
  delivered: boolean
  delivery_date: string | null
}

interface ContractServiceBadgesProps {
  contractId: string
  clientId: string
  services: string[]
  deliverables: Deliverable[]
}

export function ContractServiceBadges({ contractId, clientId, services, deliverables }: ContractServiceBadgesProps) {
  const [isPending, startTransition] = useTransition()
  const [localDeliverables, setLocalDeliverables] = useState(deliverables)

  const nonRecurringServices = services.filter((service) => isNonRecurringService(service))

  console.log("[v0] All services:", services)
  console.log("[v0] Non-recurring services only:", nonRecurringServices)
  console.log("[v0] Deliverables:", localDeliverables)

  if (!nonRecurringServices || nonRecurringServices.length === 0) return null

  const handleServiceClick = async (serviceName: string) => {
    console.log("[v0] Service clicked:", serviceName)

    // Encontra o deliverable correspondente
    const deliverable = localDeliverables.find((d) => d.service_name === serviceName)
    console.log("[v0] Found deliverable:", deliverable)

    if (!deliverable) {
      // Se não existe deliverable, cria um novo
      console.log("[v0] Creating new deliverable")
      startTransition(async () => {
        const result = await toggleServiceDelivery({
          contractId,
          clientId,
          serviceName,
          currentStatus: false,
        })

        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(result.success)
          // Atualiza estado local otimisticamente
          setLocalDeliverables([
            ...localDeliverables,
            {
              id: crypto.randomUUID(), // Temporário até revalidar
              service_name: serviceName,
              delivered: true,
              delivery_date: new Date().toISOString().split("T")[0],
            },
          ])
        }
      })
    } else {
      // Toggle do status existente
      console.log("[v0] Toggling existing deliverable")
      startTransition(async () => {
        const result = await toggleServiceDelivery({
          contractId,
          clientId,
          serviceName,
          currentStatus: deliverable.delivered,
        })

        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(result.success)
          // Atualiza estado local otimisticamente
          setLocalDeliverables(
            localDeliverables.map((d) =>
              d.service_name === serviceName
                ? {
                    ...d,
                    delivered: !d.delivered,
                    delivery_date: !d.delivered ? new Date().toISOString().split("T")[0] : null,
                  }
                : d,
            ),
          )
        }
      })
    }
  }

  const isServiceDelivered = (serviceName: string): boolean => {
    const deliverable = localDeliverables.find((d) => d.service_name === serviceName)
    return deliverable?.delivered || false
  }

  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-muted-foreground mb-1">Serviços Únicos:</p>
      <div className="flex flex-wrap gap-1">
        {nonRecurringServices.map((service: string, idx: number) => {
          const isDelivered = isServiceDelivered(service)

          return (
            <Badge
              key={idx}
              variant={isDelivered ? "default" : "outline"}
              className={`text-xs select-none cursor-pointer hover:opacity-80 active:scale-95 transition-all ${
                isDelivered ? "bg-green-600 hover:bg-green-700 border-green-600" : ""
              }`}
              onClick={() => handleServiceClick(service)}
              title={isDelivered ? "Clique para marcar como não entregue" : "Clique para marcar como entregue"}
            >
              {service}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
