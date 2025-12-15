"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { approveEmployeePayment, rejectEmployeePayment } from "@/app/dashboard/financial/actions"
import { useState } from "react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Props {
  paymentId: string
  approvalStatus: "pending" | "approved" | "rejected"
  approvedBy?: string | null
  userRole?: string
}

export function EmployeePaymentApprovalActions({ paymentId, approvalStatus, approvedBy, userRole }: Props) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    const res = await approveEmployeePayment(paymentId)
    if (res.success) toast.success(res.message)
    else toast.error(res.error)
    setLoading(false)
  }

  const handleReject = async () => {
    setLoading(true)
    const res = await rejectEmployeePayment(paymentId)
    if (res.success) toast.success(res.message)
    else toast.error(res.error)
    setLoading(false)
  }

  if (approvalStatus === "approved") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
             <Badge className="bg-green-600 hover:bg-green-700 flex gap-1 cursor-default">
                <CheckCircle className="h-3 w-3" /> {approvedBy || "Aprovado"}
             </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Aprovado por {approvedBy || "Admin"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (approvalStatus === "rejected") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="flex gap-1 cursor-default">
              <XCircle className="h-3 w-3" /> {approvedBy || "Rejeitado"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rejeitado por {approvedBy || "Admin"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Pending
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300 flex gap-1">
        <Clock className="h-3 w-3" /> Aguardando
      </Badge>
      
      {userRole !== "limited" && (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-green-600 border-green-200" onClick={handleApprove} disabled={loading}>
            Aprovar
          </Button>
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-red-600 border-red-200" onClick={handleReject} disabled={loading}>
            Rejeitar
          </Button>
        </div>
      )}
    </div>
  )
}
