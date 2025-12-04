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
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { addEmployeeObservation } from "@/app/dashboard/team/actions"

const observationTags = [
  { value: "feedback_positivo", label: "Feedback Positivo" },
  { value: "feedback_negativo", label: "Feedback Negativo" },
  { value: "reuniao_1_1", label: "Reunião 1:1" },
  { value: "desenvolvimento", label: "Desenvolvimento" },
  { value: "performance", label: "Performance" },
  { value: "comportamento", label: "Comportamento" },
  { value: "geral", label: "Geral" },
]

export function AddObservationForm({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append("employeeId", employeeId)

    const result = await addEmployeeObservation(formData)

    if (result.error) {
      toast.error("Erro ao salvar observação", { description: result.error })
    } else {
      toast.success("Observação adicionada!")
      setOpen(false)
      router.refresh()
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Observação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Observação</DialogTitle>
          <DialogDescription>Registre uma observação sobre o colaborador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag">Categoria</Label>
            <Select name="tag" defaultValue="geral">
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {observationTags.map((tag) => (
                  <SelectItem key={tag.value} value={tag.value}>
                    {tag.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observation">Observação *</Label>
            <Textarea id="observation" name="observation" required placeholder="Descreva a observação..." rows={4} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
