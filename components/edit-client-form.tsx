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
import { updateClient } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

// Define o tipo para os dados do cliente que o formulário espera
interface Client {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  status: "active" | "inactive"
  health_status: "green" | "yellow" | "red" | null
}

interface EditClientFormProps {
  client: Client;
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Alterações"}
    </Button>
  )
}

export function EditClientForm({ client }: EditClientFormProps) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleFormSubmit(formData: FormData) {
    const result = await updateClient(formData)

    if (result.error) {
      toast.error("Erro ao atualizar cliente.", {
        description: result.error,
      })
    } else {
      toast.success(result.success)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Editar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Informações do Cliente</DialogTitle>
          <DialogDescription>
            Atualize os dados de contato e status do cliente.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 py-4">
          <input type="hidden" name="clientId" value={client.id} />
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Cliente*</Label>
            <Input id="name" name="name" defaultValue={client.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_email">Email de Contato</Label>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={client.contact_email || ''} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_phone">Telefone</Label>
            <Input id="contact_phone" name="contact_phone" defaultValue={client.contact_phone || ''} />
          </div>
          
          {/* CAMPOS DE STATUS E SAÚDE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status*</Label>
              <Select name="status" defaultValue={client.status} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="health_status">Saúde do Cliente*</Label>
              <Select name="health_status" defaultValue={client.health_status || 'green'} required>
                <SelectTrigger id="health_status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">🟢 Bom</SelectItem>
                  <SelectItem value="yellow">🟡 Atenção</SelectItem>
                  <SelectItem value="red">🔴 Crítico</SelectItem>
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
