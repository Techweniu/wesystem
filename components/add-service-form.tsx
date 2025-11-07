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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// ServicesMultiSelect foi removido
import { addOneTimeService } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Serviço"}
    </Button>
  )
}

interface AddServiceFormProps {
  clientId: string
}

export function AddServiceForm({ clientId }: AddServiceFormProps) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleFormSubmit(formData: FormData) {
    formData.append("clientId", clientId)
    const result = await addOneTimeService(formData)

    if (result.error) {
      toast.error("Erro ao adicionar serviço.", {
        description: result.error,
      })
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
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Serviço Pontual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Serviço Pontual</DialogTitle>
          <DialogDescription>Lance um novo serviço avulso para este cliente.</DialogDescription>
        </DialogHeader>
        {/* O layout do formulário foi refeito para ser vertical (space-y-4) */}
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Serviço*</Label>
            <Input id="name" name="name" placeholder="Ex: Criação de Logo" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="value">Valor*</Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="0.01"
                placeholder="Ex: 1500.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Data*</Label>
              <Input id="date" name="date" type="date" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status Inicial*</Label>
            <Select name="status" defaultValue="pending" required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              O status será "Concluído" automaticamente quando o pagamento for registrado no Financeiro.
            </p>
          </div>

          {/* O ServicesMultiSelect foi removido daqui */}

          <DialogFooter>
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
