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

interface AddCostDialogProps {
  employees: Array<{ id: string; name: string }>
}

export function AddCostDialog({ employees }: AddCostDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedFile) {
      toast.error("Por favor, anexe o comprovante de pagamento")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.set("is_recurring", isRecurring.toString())
    formData.set("proof_file", selectedFile)

    const result = await addCost(formData)

    if (result.success) {
      toast.success("Custo adicionado com sucesso!")
      e.currentTarget.reset()
      setIsRecurring(false)
      setSelectedFile(null)
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
          <DialogDescription>Preencha os detalhes do custo abaixo</DialogDescription>
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
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input id="category" name="category" placeholder="Ex: Salários, Marketing, Infraestrutura" required />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="proof_file">Comprovante de Pagamento *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="proof_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  className="cursor-pointer"
                />
                {selectedFile && <span className="text-sm text-muted-foreground">{selectedFile.name}</span>}
              </div>
              <p className="text-xs text-muted-foreground">Formatos aceitos: PDF, JPG, PNG (máx. 10MB)</p>
            </div>

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
