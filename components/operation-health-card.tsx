"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface OperationHealthCardProps {
  status: "healthy" | "warning" | "critical"
  details: {
    criticalClients: number
    nps: number
  }
}

export function OperationHealthCard({ status, details }: OperationHealthCardProps) {
  // Configuração visual baseada no status
  const config = {
    healthy: {
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
      icon: CheckCircle,
      title: "Operação Saudável",
      description: "Todos os indicadores estão dentro do esperado."
    },
    warning: {
      color: "text-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      icon: AlertTriangle,
      title: "Atenção Necessária",
      description: "Alguns indicadores requerem monitoramento."
    },
    critical: {
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-900/20",
      icon: XCircle,
      title: "Estado Crítico",
      description: "Ação imediata necessária em clientes ou qualidade."
    }
  }

  const currentConfig = config[status]
  const Icon = currentConfig.icon

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Saúde da Operação</CardTitle>
        <CardDescription>Diagnóstico automático baseado em NPS e Risco.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
        <div className={`rounded-full p-4 mb-4 ${currentConfig.bg}`}>
          <Icon className={`h-12 w-12 ${currentConfig.color}`} />
        </div>
        <h3 className={`text-xl font-bold mb-1 ${currentConfig.color}`}>
          {currentConfig.title}
        </h3>
        <p className="text-sm text-center text-muted-foreground mb-6 px-4">
          {currentConfig.description}
        </p>

        <div className="w-full grid grid-cols-2 gap-4 border-t pt-4">
          <div className="text-center">
             <p className="text-xs text-muted-foreground mb-1">NPS Médio</p>
             <p className="font-semibold">{details.nps.toFixed(1)}</p>
          </div>
          <div className="text-center border-l">
             <p className="text-xs text-muted-foreground mb-1">Clientes Críticos</p>
             <p className={`font-semibold ${details.criticalClients > 0 ? "text-red-500" : ""}`}>
                {details.criticalClients}
             </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
