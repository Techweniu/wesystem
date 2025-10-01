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
import { addClient } from "@/app/dashboard/clients/actions"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Criar Cliente"}
    </Button>
  )
}

export function AddClientForm() {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleFormSubmit(formData: FormData) {
    const result = await addClient(formData)

    if (result.error) {
      toast.error("Erro ao criar cliente", { description: result.error })
    } else {
      toast.success(result.success)
      setOpen(false)
      formRef.current?.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>Preencha os dados do cliente e do contrato inicial (opcional).</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Cliente*</Label>
              <Input id="name" name="name" placeholder="Ex: Empresa ABC Ltda" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_email">Email de Contato</Label>
              <Input id="contact_email" name="contact_email" type="email" placeholder="contato@empresa.com" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_phone">Telefone</Label>
              <Input id="contact_phone" name="contact_phone" placeholder="(11) 99999-9999" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status*</Label>
              <Select name="status" defaultValue="prospect" required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Dados do Contrato (Opcional)</h4>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="monthly_value">Valor Mensal (R$)</Label>
                  <Input id="monthly_value" name="monthly_value" type="number" step="0.01" min="0" placeholder="0.00" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Data de Início</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="end_date">Data de Término</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                </div>
              </div>
            </div>
          </div>

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
