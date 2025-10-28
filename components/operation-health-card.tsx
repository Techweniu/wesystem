"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Activity, UserPlus, CheckCircle2 } from "lucide-react"
import { getOperationHealth } from "@/app/dashboard/actions"
import { Badge } from "@/components/ui/badge"

type OperationHealthData = {
  activeClients: number
  totalEmployees: number
  roleCount: Record<string, number>
  alerts: Array<{
    role: string
    current: number
    needed: number
    capacity: number
    status: "ok" | "warning" | "critical"
  }>
  overallRatio: number
}

export function OperationHealthCard() {
  const [healthData, setHealthData] = useState<OperationHealthData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchHealth = () => {
    startTransition(async () => {
      setError(null)
      try {
        const result = await getOperationHealth()
        setHealthData(result)
      } catch (err) {
        setError("Erro ao carregar dados de saúde operacional")
        console.error(err)
      }
    })
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const getStatusColor = (status: "ok" | "warning" | "critical") => {
    switch (status) {
      case "ok":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "critical":
        return "text-red-500"
    }
  }

  const getStatusBadge = (status: "ok" | "warning" | "critical") => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-500">Saudável</Badge>
      case "warning":
        return <Badge className="bg-yellow-500">Atenção</Badge>
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>
    }
  }

  const overallStatus = healthData?.alerts.some((a) => a.status === "critical")
    ? "critical"
    : healthData?.alerts.some((a) => a.status === "warning")
      ? "warning"
      : "ok"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={`h-5 w-5 ${getStatusColor(overallStatus)}`} />
          <CardTitle>Saúde da Operação</CardTitle>
          {healthData && getStatusBadge(overallStatus)}
        </div>
        <Button variant="outline" size="sm" onClick={fetchHealth} disabled={isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Atualizando..." : "Atualizar"}
        </Button>
      </CardHeader>
      <CardContent>
        {isPending && !healthData ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : healthData ? (
          <div className="space-y-4">
            {/* Resumo Geral */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">{healthData.activeClients}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Colaboradores</p>
                <p className="text-2xl font-bold">{healthData.totalEmployees}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proporção Geral</p>
                <p className="text-2xl font-bold">{healthData.overallRatio.toFixed(1)}</p>
              </div>
            </div>

            {/* Alertas por Cargo */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Alertas de Contratação</h4>
              {healthData.alerts.map((alert) => (
                <div
                  key={alert.role}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.status === "critical"
                      ? "border-red-500 bg-red-500/10"
                      : alert.status === "warning"
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-green-500 bg-green-500/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {alert.status === "ok" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className={`h-5 w-5 ${getStatusColor(alert.status)}`} />
                    )}
                    <div>
                      <p className="font-medium">{alert.role}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.current} {alert.current === 1 ? "profissional" : "profissionais"} • Capacidade:{" "}
                        {alert.capacity} clientes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {alert.needed > 0 ? (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span className="font-semibold">Contratar {alert.needed}</span>
                      </div>
                    ) : alert.status === "warning" ? (
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">Próximo do limite</span>
                    ) : (
                      <span className="text-sm text-green-600 dark:text-green-400">Capacidade OK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mensagem de Resumo */}
            {overallStatus === "critical" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ação Necessária</AlertTitle>
                <AlertDescription>
                  A capacidade operacional está comprometida. Considere contratar novos profissionais para manter a
                  qualidade do serviço.
                </AlertDescription>
              </Alert>
            )}
            {overallStatus === "warning" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  A equipe está próxima da capacidade máxima. Planeje contratações futuras.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
