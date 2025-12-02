"use client"

import { Card, CardContent } from "@/components/ui/card"
import { UserCircle } from "lucide-react"
import { DeleteOrgPositionButton } from "@/components/delete-org-position-button"
import { EditOrgPositionForm } from "@/components/edit-org-position-form"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

interface OrgPosition {
  id: string
  name: string
  role: string
  manager_id?: string | null;
  children: OrgPosition[]
}

interface OrgChartTreeProps {
  employee: OrgPosition
  allEmployees: OrgPosition[]
}

export function OrgChartTree({ employee, allEmployees }: OrgChartTreeProps) {
  const userRole = useRole(); // --- ALTERAÇÃO

  return (
    <div className="flex flex-col items-center">
      <Card className="relative group w-64 border-2 border-primary/20 bg-card hover:border-primary/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{employee.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{employee.role}</p>
            </div>
          </div>
        </CardContent>
        {/* Botões de Ação */}
        {/* --- ALTERAÇÃO: Só mostra se não for limitado --- */}
        {userRole !== "limited" && (
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
             <EditOrgPositionForm position={employee} allPositions={allEmployees} />
             <DeleteOrgPositionButton position={employee} />
          </div>
        )}
        {/* ------------------------------------------------ */}
      </Card>

      {/* Conectores e Children */}
      {employee.children && employee.children.length > 0 && (
        <>
          <div className="relative h-8 w-full">
            <div className="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-border" />
            {employee.children.length > 1 && (
              <div 
                className="absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-border"
                style={{ width: `${(employee.children.length - 1) * 272}px` }} 
              />
            )}
          </div>
          <div className="flex justify-center gap-4">
            {employee.children.map((child) => (
              <div key={child.id} className="relative pt-8">
                <div className="absolute top-0 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-border" />
                <OrgChartTree employee={child} allEmployees={allEmployees} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
