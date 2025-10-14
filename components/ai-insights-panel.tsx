"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { getAiInsights } from "@/app/dashboard/actions";
import { Separator } from "./ui/separator";

export function AiInsightsPanel() {
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchInsights = () => {
    startTransition(async () => {
      setError(null);
      const result = await getAiInsights();
      if (result.error) {
        setError(result.error);
      } else {
        setInsights(result.success);
      }
    });
  };

  // Busca os insights na primeira vez que o componente é carregado
  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Insights da IA</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInsights} disabled={isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? "Analisando..." : "Atualizar"}
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Gerar Insights</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ul className="list-disc pl-5 space-y-2">
              {insights?.split('- ').filter(line => line.trim()).map((line, index) => (
                <li key={index}>{line.trim()}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
