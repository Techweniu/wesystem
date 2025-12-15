"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { approveService, rejectService } from "@/app/dashboard/clients/[id]/actions"
import { useState } from "react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Props {
  serviceId: string
  approvalStatus: "pending" | "approved" | "rejected"
  approvedBy?: string | null
  userRole?: string
}

export function ServiceApprovalActions({ serviceId, approvalStatus, approvedBy, userRole }: Props) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    const res = await approveService(serviceId)
    if (res.success) toast.success(res.message)
    else toast.error(res.error)
    setLoading(false)
  }

  const handleReject = async () => {
    setLoading(true)
    const res = await rejectService(serviceId)
    if (res.success) toast.success(res.message)
    else toast.error(res.error)
    setLoading(false)
  }

  if (approvalStatus === "approved") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center">
             <Badge className="bg-green-600 hover:bg-green-700 flex gap-1 h-6 w-fit cursor-default">
                <CheckCircle className="h-3 w-3" />
             </Badge>
            </div>
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
            <div className="flex justify-center">
                <Badge variant="destructive" className="flex gap-1 h-6 w-fit cursor-default">
                    <XCircle className="h-3 w-3" />
                </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rejeitado por {approvedBy || "Admin"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300 text-[10px] px-1 h-5">
        Aguardando
      </Badge>
      
      {userRole !== "limited" && (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:bg-green-50" onClick={handleApprove} disabled={loading} title="Aprovar">
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:bg-red-50" onClick={handleReject} disabled={loading} title="Rejeitar">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
