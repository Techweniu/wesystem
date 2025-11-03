"use client"

import { useState } from "react"
import Link from "next/link"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { EditEmployeeForm } from "@/components/edit-employee-form"
import { MarkPaymentButton } from "@/components/mark-payment-button"
import { CareerPlanExpirationBadge } from "@/components/career-plan-expiration-badge"

type Employee = any

const renderPaymentStatus = (days: number | null) => {
  if (days === null) return <Badge variant="outline">A definir</Badge>
  if (days < 0) return <Badge variant="destructive">Vencido</Badge>
  if (days <= 7) return <Badge variant="secondary">{days} dias</Badge>
  return <span>{days} dias</span>
}

export function TeamTableRow({ employee, allEmployees }: { employee: Employee; allEmployees: Employee[] }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <Link href={`/dashboard/team/${employee.id}`} className="hover:underline flex items-center">
            {employee.name}
            <CareerPlanExpirationBadge expirationDate={employee.career_plan_expiration_date} />
          </Link>
          <p className="text-xs text-muted-foreground">{employee.role}</p>
        </TableCell>
        <TableCell>
          <Badge variant={employee.status === "active" ? "default" : "outline"}>
            {employee.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          {employee.salary
            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(employee.salary)
            : "-"}
        </TableCell>
        <TableCell className="text-right font-semibold">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(employee.totalCostGenerated)}
        </TableCell>
        <TableCell>{renderPaymentStatus(employee.daysUntilPayment)}</TableCell>
        <TableCell>{employee.nextPaymentDateFormatted || "-"}</TableCell>
        <TableCell>
          <MarkPaymentButton
            employeeId={employee.id}
            salary={employee.salary || 0}
            isPaidThisMonth={employee.isPaidThisMonth}
          />
        </TableCell>
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
