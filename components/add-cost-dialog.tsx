"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus } from "lucide-react"
import { addCost } from "@/app/dashboard/financial/actions"
import { toast } from "sonner"
// --- ATUALIZAÇÃO (Início) ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// --- ATUALIZAÇÃO (Fim) ---

interface AddCostDialogProps {
  employees: Array<{ id: string; name: string }>
  costCategories: Array<{ id: string; name: string }> // <-- PROP ADICIONADA
}

export function AddCostDialog({ employees, costCategories }: AddCostDialogProps) { // <-- PROP ADICIONADA
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.set("is_recurring", isRecurring.toString())

    const result = await addCost(formData)

    if (result.success) {
      toast.success("Custo adicionado com sucesso!")
      e.currentTarget.reset()
      setIsRecurring(false)
      setOpen(false)
    } else {
      toast.error(result.error || "Erro ao adicionar custo")
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Custo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Custo</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do custo abaixo. O status inicial será "Pendente".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input id="description" name="description" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$) *</Label>
                <Input id="value" name="value" type="number" step="0.01" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* --- ATUALIZAÇÃO (Início) --- */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select name="category" required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* --- ATUALIZAÇÃO (Fim) --- */}
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Seção de comprovante foi removida daqui */}

            <div className="flex items-center space-x-2">
              <Switch id="is_recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
              <Label htmlFor="is_recurring">Custo Recorrente (mensal)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
