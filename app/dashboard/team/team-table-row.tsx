"use client"

import { useState } from "react"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { EditEmployeeForm } from "@/components/edit-employee-form"
import { MarkPaymentButton } from "@/components/mark-payment-button"
import { EmployeeObservationsDialog } from "@/components/employee-observations-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Tipos...
type Employee = any; // Simplificado para o exemplo

const renderPaymentStatus = (days: number | null) => {
  if (days === null) return <Badge variant="outline">A definir</Badge>;
  if (days < 0) return <Badge variant="destructive">Vencido</Badge>;
  if (days <= 7) return <Badge variant="secondary">{days} dias</Badge>;
  return <span>{days} dias</span>
}

export function TeamTableRow({ employee, allEmployees }: { employee: Employee, allEmployees: Employee[] }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{employee.name}<p className="text-xs text-muted-foreground">{employee.role}</p></TableCell>
        <TableCell><Badge variant={employee.status === "active" ? "default" : "outline"}>{employee.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
        <TableCell className="text-right">{employee.salary ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", }).format(employee.salary) : "-"}</TableCell>
        <TableCell className="text-right font-semibold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(employee.totalCostGenerated)}</TableCell>
        <TableCell>{renderPaymentStatus(employee.daysUntilPayment)}</TableCell>
        <TableCell>{employee.nextPaymentDateFormatted || "-"}</TableCell>
        <TableCell>
          <MarkPaymentButton
            employeeId={employee.id}
            salary={employee.salary || 0}
            isPaidThisMonth={employee.isPaidThisMonth}
          />
        </TableCell>
        <TableCell>
          <EmployeeObservationsDialog
            employeeId={employee.id}
            observations={employee.employee_observations}
          />
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                Editar Colaborador
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* O Dialog agora vive fora da tabela, mas é controlado pela linha */}
      <EditEmployeeForm
        employee={employee}
        allEmployees={allEmployees}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  )
}
