"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trash2, Calendar, TrendingUp, Target } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { deleteCommercialGoal } from "@/app/dashboard/commercial/actions"
import { toast } from "sonner"
import { useState } from "react"

interface CommercialGoalCardProps {
  goal: {
    id: string
    period_type: string
    period_start: string
    period_end: string
    target_value: number
    description: string | null
    realized_revenue: number
    recurring_revenue?: number
    progress: number
  }
}

export function CommercialGoalCard({ goal }: CommercialGoalCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const periodTypeLabel = {
    monthly: "Mensal",
    quarterly: "Trimestral",
    yearly: "Anual",
  }[goal.period_type]

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar esta meta?")) return

    setIsDeleting(true)
    const result = await deleteCommercialGoal(goal.id)

    if (result.success) {
      toast.success("Meta deletada com sucesso!")
    } else {
      toast.error("Erro ao deletar meta")
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <Badge variant="outline">{periodTypeLabel}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} className="h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-lg">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(goal.target_value)}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs">
          <Calendar className="h-3 w-3" />
          {format(parseISO(goal.period_start), "dd/MM/yy", { locale: ptBR })} -{" "}
          {format(parseISO(goal.period_end), "dd/MM/yy", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{goal.progress.toFixed(1)}%</span>
          </div>
          
          {/* O fundo (track) é definido como amarelo aqui */}
          {/* O indicador (fill) usará 'bg-primary' (verde) por padrão */}
          <Progress 
            value={Math.min(goal.progress, 100)} 
            className="bg-amber-500/30" 
          />
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Realizado</span>
          </div>
          <span className="font-semibold">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(goal.realized_revenue || 0)}
          </span>
        </div>

        {goal.description && (
          <p className="text-xs text-muted-foreground pt-2 border-t line-clamp-2">{goal.description}</p>
        )}
      </CardContent>
    </Card>
  )
}
