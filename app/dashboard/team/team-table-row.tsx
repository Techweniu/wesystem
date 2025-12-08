"use client"

import { useState } from "react"
import Link from "next/link"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MapPin, Home } from "lucide-react"
import { EditEmployeeForm } from "@/components/edit-employee-form"
import { CareerPlanExpirationBadge } from "@/components/career-plan-expiration-badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Employee = any

const renderPaymentStatus = (days: number | null) => {
  if (days === null) return <Badge variant="outline">A definir</Badge>
  if (days < 0) return <Badge variant="destructive">Vencido</Badge>
  if (days <= 7) return <Badge variant="secondary">{days} dias</Badge>
  return <span className="text-foreground">{days} dias</span>
}

export function TeamTableRow({ employee, allEmployees }: { employee: Employee; allEmployees: Employee[] }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/team/${employee.id}`} className="hover:underline flex items-center text-foreground">
              {employee.name}
            </Link>
            <CareerPlanExpirationBadge expirationDate={employee.career_plan_expiration_date} />

            {/* Ícones de Modelo de Trabalho */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {employee.work_model === "home_office" ? (
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded-full">
                      <Home className="h-3 w-3" />
                    </div>
                  ) : employee.work_model === "presential" ? (
                    <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-1 rounded-full">
                      <MapPin className="h-3 w-3" />
                    </div>
                  ) : null}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold text-popover-foreground">
                    {employee.work_model === "home_office" ? "Home Office" : "Presencial"}
                  </p>
                  {employee.work_model === "presential" && employee.office_location && (
                    <p className="text-xs text-muted-foreground">{employee.office_location}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {employee.role}
            {employee.office_location && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1 rounded ml-1">
                {employee.office_location}
              </span>
            )}
          </p>
        </TableCell>
        <TableCell>
          <Badge
            variant={employee.status === "active" ? "default" : "outline"}
            className={employee.status === "active" ? "bg-primary text-primary-foreground" : ""}
          >
            {employee.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </TableCell>
        <TableCell className="text-right text-foreground">
          {employee.salary
            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(employee.salary)
            : "-"}
        </TableCell>
        <TableCell className="text-right font-semibold text-foreground">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(employee.totalCostGenerated)}
        </TableCell>
        <TableCell>{renderPaymentStatus(employee.daysUntilPayment)}</TableCell>
        <TableCell className="text-foreground">{employee.nextPaymentDateFormatted || "-"}</TableCell>

        <TableCell className="text-right">
          <Link href={`/dashboard/team/${employee.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </TableCell>
      </TableRow>

      <EditEmployeeForm
        employee={employee}
        allEmployees={allEmployees}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  )
}
