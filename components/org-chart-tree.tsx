"use client"

import { Card, CardContent } from "@/components/ui/card"
import { UserCircle } from "lucide-react"
import { DeleteOrgPositionButton } from "./delete-org-position-button"

interface OrgPosition {
  id: string
  name: string
  role: string
  children: OrgPosition[]
}

interface OrgChartTreeProps {
  employee: OrgPosition
}

export function OrgChartTree({ employee }: OrgChartTreeProps) {
  return (
    <div className="flex flex-col items-center">
      {/* O card agora precisa ser relativo para posicionar o botão de apagar */}
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
        {/* O botão de apagar só aparece quando o mouse está sobre o card */}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
           <DeleteOrgPositionButton position={employee} />
        </div>
      </Card>

      {/* Children */}
      {employee.children && employee.children.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          <div className="h-8 w-0.5 bg-border" />
          <div className="relative">
            {employee.children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-border"
                style={{
                  left: "50%",
                  right: "50%",
                  width: `${(employee.children.length - 1) * 280}px`,
                  transform: "translateX(-50%)",
                }}
              />
            )}
            <div className="flex gap-4 pt-8">
              {employee.children.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  <div className="absolute -top-8 h-8 w-0.5 bg-border" />
                  <OrgChartTree employee={child} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
