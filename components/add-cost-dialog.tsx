"use client"

import type React from "react"
import { useState, useRef } from "react"
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
import { Plus, Upload, FileText, X } from "lucide-react"
import { addCost } from "@/app/dashboard/financial/actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddCostDialogProps {
  employees: Array<{ id: string; name: string }>
  costCategories: Array<{ id: string; name: string }>
}

export function AddCostDialog({ employees, costCategories }: AddCostDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceDays, setRecurrenceDays] = useState(30)
  // Estado para armazenar a data final (string vazia = sem expiração)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!proofFile) {
      toast.error("Comprovante obrigatório", { description: "Anexe um comprovante do custo para continuar." })
      return
    }

    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.set("is_recurring", isRecurring.toString())
    formData.set("recurrence_days", recurrenceDays.toString())
    // Envia a data final (vazia ou preenchida)
    formData.set("recurrence_end_date", recurrenceEndDate)
    formData.set("proof_file", proofFile)

    const result = await addCost(formData)

    if (result.success) {
      toast.success("Custo adicionado com sucesso!")
      formRef.current?.reset()
      setIsRecurring(false)
      setRecurrenceDays(30)
      setRecurrenceEndDate("") // Reseta para sem expiração
      setProofFile(null)
      setOpen(false)
    } else {
      toast.error(result.error || "Erro ao adicionar custo")
    }

    setIsSubmitting(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande", { description: "O tamanho máximo é 10MB." })
        return
      }
      setProofFile(file)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setProofFile(null)
          setIsRecurring(false)
          setRecurrenceDays(30)
          setRecurrenceEndDate("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Custo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Custo</DialogTitle>
          <DialogDescription>Preencha os detalhes do custo e anexe o comprovante.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
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
              <Label htmlFor="proof_file">Comprovante *</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {proofFile ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">{proofFile.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setProofFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="proof_file"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para anexar comprovante</span>
                    </label>
                  )}
                  <Input
                    id="proof_file"
                    name="proof_file_input"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Formatos aceitos: imagens ou PDF (máx. 10MB)</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch id="is_recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                <Label htmlFor="is_recurring">Custo Recorrente</Label>
              </div>

              {isRecurring && (
                <div className="ml-6 p-4 border rounded-lg bg-muted/30 space-y-4">
                  
                  {/* Bloco de Dias de Recorrência */}
                  <div className="space-y-2">
                    <Label htmlFor="recurrence_days">Intervalo de Recorrência (dias) *</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="recurrence_days"
                        type="number"
                        min="1"
                        max="365"
                        value={recurrenceDays}
                        onChange={(e) => setRecurrenceDays(Number(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">dias</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={recurrenceDays === 30 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecurrenceDays(30)}
                    >
                      Mensal (30)
                    </Button>
                    <Button
                      type="button"
                      variant={recurrenceDays === 365 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecurrenceDays(365)}
                    >
                      Anual (365)
                    </Button>
                  </div>

                  {/* NOVO BLOCO: Data Limite (Opção sem expiração) */}
                  <div className="space-y-2 border-t pt-4 mt-2">
                    <Label htmlFor="recurrence_end_date">Repetir até (Opcional)</Label>
                    <div className="flex items-center gap-4">
                        <Input
                        id="recurrence_end_date"
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="w-full max-w-[200px]"
                        />
                        {recurrenceEndDate && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setRecurrenceEndDate("")}
                                className="text-xs text-muted-foreground hover:text-destructive"
                            >
                                <X className="mr-1 h-3 w-3" /> Limpar (Sem expiração)
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recurrenceEndDate 
                        ? "A recorrência parará automaticamente após esta data." 
                        : "Deixe em branco para repetir indefinidamente (Sem expiração)."}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground border-t pt-2">
                    Ao marcar este custo como pago, um novo será criado automaticamente.
                  </p>
                </div>
              )}
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
