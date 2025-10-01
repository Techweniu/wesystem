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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addOneTimeService } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Serviço"}
    </Button>
  )
}

interface AddServiceFormProps {
  clientId: string;
}

export function AddServiceForm({ clientId }: AddServiceFormProps) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleFormSubmit(formData: FormData) {
    formData.append('clientId', clientId); // Adiciona o ID do cliente ao formulário
    const result = await addOneTimeService(formData)

    if (result.error) {
      toast.error("Erro ao adicionar serviço.", {
        description: result.error,
      })
    } else {
      toast.success(result.success)
      setOpen(false)
      formRef.current?.reset()
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Serviço Pontual</DialogTitle>
          <DialogDescription>
            Lance um novo serviço avulso para este cliente.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Serviço*</Label>
              <Input id="name" name="name" placeholder="Ex: Criação de Logo" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">Valor*</Label>
              <Input id="value" name="value" type="number" step="0.01" placeholder="Ex: 1500.00" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Data*</Label>
              <Input id="date" name="date" type="date" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status*</Label>
              <Select name="status" defaultValue="pending" required>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
