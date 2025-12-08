"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Target, Calendar } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { deleteCommercialGoal } from "@/app/dashboard/commercial/actions"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCommercialGoal } from "@/app/dashboard/commercial/actions"
import { useState } from "react"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

interface Goal {
  id: string
  title: string
  type: string
  current_value: number
  target_value: number
  deadline: string
}

export function CommercialGoalCard({ goal }: { goal: Goal }) {
  const userRole = useRole() // --- ALTERAÇÃO
  const [isEditOpen, setIsEditOpen] = useState(false)

  const percentage = Math.min(100, Math.max(0, (goal.current_value / goal.target_value) * 100))
  const daysLeft = differenceInDays(parseISO(goal.deadline), new Date())

  // --- ALTERAÇÃO: Se limitado, não mostra ações ---
  const canEdit = userRole !== "limited"
  // ----------------------------------------------

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return
    const result = await deleteCommercialGoal(goal.id)
    if (result.success) toast.success(result.message)
    else toast.error(result.error)
  }

  async function handleUpdate(formData: FormData) {
    const result = await updateCommercialGoal(goal.id, formData)
    if (result.success) {
      toast.success(result.message)
      setIsEditOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{goal.title}</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="mt-2 space-y-4">
          <div>
            <div className="flex items-end justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-bold">{percentage.toFixed(0)}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          <div className="flex justify-between text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Atual</p>
              <p className="font-bold">{goal.current_value}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Meta</p>
              <p className="font-bold">{goal.target_value}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span>
              {daysLeft > 0 ? (
                <span className="text-foreground font-medium">{daysLeft} dias restantes</span>
              ) : (
                <span className="text-destructive font-medium">Prazo encerrado</span>
              )}{" "}
              ({format(parseISO(goal.deadline), "dd/MM", { locale: ptBR })})
            </span>
          </div>

          {/* Botões de Ação (Protegidos) */}
          {canEdit && (
            <div className="flex justify-end gap-2 pt-2">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Meta</DialogTitle>
                  </DialogHeader>
                  <form action={handleUpdate} className="space-y-4 pt-4">
                    <input type="hidden" name="title" value={goal.title} />
                    <input type="hidden" name="type" value={goal.type} />
                    <input type="hidden" name="deadline" value={goal.deadline} />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Valor Atual</Label>
                        <Input name="current_value" type="number" defaultValue={goal.current_value} step="0.01" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Meta Alvo</Label>
                        <Input name="target_value" type="number" defaultValue={goal.target_value} step="0.01" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Salvar Alterações
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
