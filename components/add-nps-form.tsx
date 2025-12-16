"use client"

import { useState, useRef } from "react"
import { useFormStatus } from "react-dom"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addNpsResponse } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

// Mapeamento seguro: ID técnico vs Rótulo de exibição
const npsCategories = [
  { id: "conteudos_roteiros", label: "Conteúdos e Roteiros" },
  { id: "audiovisual", label: "Audiovisual" },
  { id: "edicao_videos", label: "Edição de Vídeos" },
  { id: "design", label: "Design" },
  { id: "atendimento_assessor", label: "Atendimento Assessor" },
  { id: "atendimento_videomaker", label: "Atendimento VideoMaker" },
  { id: "comunicacao_presenca", label: "Comunicação e Presença" },
  { id: "resultado_parceria", label: "Resultado da Parceria" },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Avaliação"}
    </Button>
  )
}

interface AddNpsFormProps {
  clientId?: string
  clients?: { id: string; name: string }[]
}

export function AddNpsForm({ clientId, clients }: AddNpsFormProps) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleFormSubmit(formData: FormData) {
    // Se o clientId foi passado como prop, adiciona manualmente
    // Se não, o formulário já deve conter um campo "clientId" vindo do Select
    if (clientId) {
      formData.append("clientId", clientId)
    }

    // Validação extra caso não tenha clientId nem no prop nem no form
    if (!formData.get("clientId")) {
      toast.error("Por favor, selecione um cliente.")
      return
    }

    const result = await addNpsResponse(formData)

    if (result.error) {
      toast.error("Erro ao salvar NPS.", { description: result.error })
    } else {
      toast.success(result.success)
      setOpen(false)
      formRef.current?.reset()
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={clients ? "default" : "sm"}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {clients ? "Nova Avaliação NPS" : "Adicionar NPS"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Registrar Avaliação NPS</DialogTitle>
          <DialogDescription>Preencha as notas de 0 a 10 para cada categoria.</DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto pr-4 -mr-4 px-1">
            <div className="grid gap-4 py-2">
              
              {/* Se não temos um clientId fixo, mostra o seletor de clientes */}
              {!clientId && clients && (
                <div className="grid gap-2">
                  <Label htmlFor="clientId">Cliente*</Label>
                  <Select name="clientId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {npsCategories.map((category) => (
                <div key={category.id} className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor={category.id} className="col-span-2">
                    {category.label}*
                  </Label>
                  <Input
                    id={category.id}
                    name={category.id}
                    type="number"
                    min="0"
                    max="10"
                    required
                    className="col-span-1"
                  />
                </div>
              ))}
              <div className="grid gap-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea id="observations" name="observations" placeholder="Comentários, elogios, críticas..." />
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-auto pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
