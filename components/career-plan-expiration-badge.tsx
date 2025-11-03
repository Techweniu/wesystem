"use client"

import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock } from "lucide-react"
import { differenceInDays, parseISO } from "date-fns"

interface CareerPlanExpirationBadgeProps {
  expirationDate: string | null
}

export function CareerPlanExpirationBadge({ expirationDate }: CareerPlanExpirationBadgeProps) {
  if (!expirationDate) return null

  const today = new Date()
  const expDate = parseISO(expirationDate)
  const daysUntilExpiration = differenceInDays(expDate, today)

  // Mostra badge apenas se faltar 7 dias ou menos
  if (daysUntilExpiration > 7) return null

  // Se já expirou
  if (daysUntilExpiration < 0) {
    return (
      <Badge variant="destructive" className="ml-2">
        <AlertCircle className="h-3 w-3 mr-1" />
        Plano Expirado
      </Badge>
    )
  }

  // Se está próximo de expirar (7 dias ou menos)
  return (
    <Badge variant="outline" className="ml-2 border-amber-500 text-amber-700 bg-amber-50">
      <Clock className="h-3 w-3 mr-1" />
      {daysUntilExpiration === 0 ? "Expira hoje" : `${daysUntilExpiration}d para expirar`}
    </Badge>
  )
}
