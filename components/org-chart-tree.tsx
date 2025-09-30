"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, UserCircle } from "lucide-react"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string | null
  children: Employee[]
}

interface OrgChartTreeProps {
  employee: Employee
}

export function OrgChartTree({ employee }: OrgChartTreeProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Employee Card */}
      <Card className="w-64 border-2 border-primary/20 bg-card hover:border-primary/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{employee.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{employee.role}</p>
              {employee.department && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {employee.department}
                </Badge>
              )}
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{employee.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      {employee.children && employee.children.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          {/* Vertical Line */}
          <div className="h-8 w-0.5 bg-border" />

          {/* Horizontal Line Container */}
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

            {/* Children Grid */}
            <div className="flex gap-4 pt-8">
              {employee.children.map((child, index) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical connector to horizontal line */}
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
