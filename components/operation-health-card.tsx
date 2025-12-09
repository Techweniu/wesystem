"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, AlertCircle, CheckCircle, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RoleMetric {
  roleName: string
  currentLoad: number // Total de clientes ativos
  capacityPerPerson: number
  totalEmployees: number
  maxCapacity: number
  usagePercent: number
  status: "healthy" | "warning" | "critical"
  hireNeeded: number
}

interface OperationHealthCardProps {
  metrics: RoleMetric[]
  totalActiveClients: number
}

export function OperationHealthCard({ metrics, totalActiveClients }: OperationHealthCardProps) {
  // Determina o status geral baseado no pior cenário
  const isCritical = metrics.some((m) => m.status === "critical")
  const isWarning = metrics.some((m) => m.status === "warning")

  let overallStatus = "Saudável"
  let statusColor = "text-green-500"
  let statusIcon = CheckCircle
  let statusBg = "bg-green-50 dark:bg-green-900/20"

  if (isCritical) {
    overallStatus = "Sobrecarga Crítica"
    statusColor = "text-red-500"
    statusIcon = AlertCircle
    statusBg = "bg-red-50 dark:bg-red-900/20"
  } else if (isWarning) {
    overallStatus = "Atenção Necessária"
    statusColor = "text-yellow-500"
    statusIcon = AlertCircle
    statusBg = "bg-yellow-50 dark:bg-yellow-900/20"
  }

  const Icon = statusIcon

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Capacidade Operacional</CardTitle>
          <Badge variant="outline" className="font-mono">
            {totalActiveClients} Clientes Ativos
          </Badge>
        </div>
        <CardDescription>Monitoramento de carga x equipe.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`mb-6 flex items-center gap-4 rounded-lg p-3 ${statusBg}`}>
          <Icon className={`h-8 w-8 ${statusColor}`} />
          <div>
            <h3 className={`font-bold ${statusColor}`}>{overallStatus}</h3>
            <p className="text-xs text-muted-foreground">
              {isCritical
                ? "Contratações urgentes necessárias para manter a qualidade."
                : "Equipe dimensionada corretamente para a demanda atual."}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {metrics.map((metric) => (
            <div key={metric.roleName} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  {metric.roleName}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({metric.totalEmployees} pessoas)
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {metric.currentLoad} / {metric.maxCapacity} clientes
                </span>
              </div>
              
              <Progress 
                value={metric.usagePercent} 
                className={`h-2 ${metric.usagePercent > 100 ? "[&>div]:bg-red-500" : metric.usagePercent > 85 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`} 
              />
              
              <div className="flex justify-between items-center h-4">
                <p className="text-[10px] text-muted-foreground">
                   Meta: 1 a cada {metric.capacityPerPerson} clientes
                </p>
                
                {metric.hireNeeded > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] flex gap-1">
                    <PlusCircle className="h-3 w-3" />
                    Contratar +{metric.hireNeeded}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
