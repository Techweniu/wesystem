"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addCommercialGoal } from "@/app/dashboard/commercial/actions"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar Meta"}
    </Button>
  )
}

export function AddCommercialGoalForm() {
  const userRole = useRole() // --- ALTERAÇÃO
  const [open, setOpen] = useState(false)

  // --- ALTERAÇÃO: Se limitado, não renderiza ---
  if (userRole === "limited") return null;
  // -------------------------------------------

  async function handleAction(formData: FormData) {
    const result = await addCommercialGoal(formData)
    if (result.success) {
      toast.success(result.message)
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Definir Nova Meta</DialogTitle>
          <DialogDescription>Crie uma meta para acompanhar o desempenho.</DialogDescription>
        </DialogHeader>
        <form action={handleAction} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Meta</Label>
            <Input id="title" name="title" placeholder="Ex: Atingir 100k MRR" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Métrica</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Receita (MRR)</SelectItem>
                <SelectItem value="clients">Número de Clientes</SelectItem>
                <SelectItem value="upsell_value">Valor de Upsell</SelectItem>
                <SelectItem value="churn_rate">Taxa de Churn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current_value">Valor Atual</Label>
              <Input id="current_value" name="current_value" type="number" step="0.01" placeholder="0" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target_value">Meta (Alvo)</Label>
              <Input id="target_value" name="target_value" type="number" step="0.01" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deadline">Prazo Final</Label>
            <Input id="deadline" name="deadline" type="date" required />
          </div>
          <Button type="submit" className="w-full">Salvar Meta</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
