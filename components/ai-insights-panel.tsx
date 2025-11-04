"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react"
import { getAiInsights } from "@/app/dashboard/actions"
import useSWR from "swr"

const fetcher = async () => {
  const result = await getAiInsights()
  if (result.error) {
    throw new Error(result.error)
  }
  return result.success
}

export function AiInsightsPanel() {
  const {
    data: insights,
    error,
    isLoading,
    mutate,
  } = useSWR("ai-insights", fetcher, {
    revalidateOnFocus: false, // Não revalida quando a janela ganha foco
    revalidateOnReconnect: false, // Não revalida quando reconecta
    dedupingInterval: 300000, // 5 minutos - evita chamadas duplicadas
  })

  const handleRefresh = () => {
    mutate() // Força revalidação
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Insights da IA</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Analisando..." : "Atualizar"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Gerar Insights</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ul className="list-disc pl-5 space-y-2">
              {insights
                ?.split("- ")
                .filter((line) => line.trim())
                .map((line, index) => (
                  <li key={index}>{line.trim()}</li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
