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
      {/* Card da Posição */}
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
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
           <DeleteOrgPositionButton position={employee} />
        </div>
      </Card>

      {/* Conectores e Children */}
      {employee.children && employee.children.length > 0 && (
        <>
          {/* Container para as linhas de conexão */}
          <div className="relative h-8 w-full">
            {/* Linha vertical que desce do card pai */}
            <div className="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-border" />
            
            {/* Linha horizontal (só aparece se houver mais de um filho) */}
            {employee.children.length > 1 && (
              <div 
                className="absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-border"
                // A largura é (número de filhos - 1) * (largura do card + gap)
                style={{ width: `${(employee.children.length - 1) * 272}px` }} 
              />
            )}
          </div>
          
          {/* Grid dos filhos */}
          <div className="flex justify-center gap-4">
            {employee.children.map((child) => (
              <div key={child.id} className="relative pt-8">
                {/* Linha vertical que sobe de cada filho */}
                <div className="absolute top-0 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-border" />
                <OrgChartTree employee={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
