"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { addCommercialGoal } from "@/app/dashboard/commercial/actions"
import { toast } from "sonner"

export function AddCommercialGoalForm() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const result = await addCommercialGoal(formData)

    if (result.success) {
      toast.success("Meta adicionada com sucesso!")
      setOpen(false)
      e.currentTarget.reset()
    } else {
      toast.error("Erro ao adicionar meta: " + result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Meta Comercial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="period_type">Tipo de Período</Label>
            <Select name="period_type" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_start">Data Início</Label>
              <Input type="date" name="period_start" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">Data Fim</Label>
              <Input type="date" name="period_end" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_value">Valor Alvo (R$)</Label>
            <Input type="number" name="target_value" step="0.01" min="0" placeholder="0,00" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea name="description" placeholder="Detalhes sobre esta meta..." rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Meta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
