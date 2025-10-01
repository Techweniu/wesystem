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
import { addClient } from "@/app/dashboard/clients/actions"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Cliente"}
    </Button>
  )
}

export function AddClientForm() {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleFormSubmit(formData: FormData) {
    const result = await addClient(formData)

    if (result.error) {
      toast.error("Erro ao criar cliente.", {
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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente e, opcionalmente, seu primeiro contrato.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            {/* --- Dados do Cliente --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome*</Label>
              <Input id="name" name="name" placeholder="Nome da Empresa" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact_email" className="text-right">Email</Label>
              <Input id="contact_email" name="contact_email" type="email" placeholder="contato@empresa.com" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact_phone" className="text-right">Telefone</Label>
              <Input id="contact_phone" name="contact_phone" placeholder="(16) 99999-9999" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status*</Label>
              <Select name="status" defaultValue="prospect" required>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            {/* --- Dados do Contrato Inicial (Opcional) --- */}
            <h4 className="text-sm font-medium text-muted-foreground">Contrato Inicial (Opcional)</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monthly_value" className="text-right">Valor Mensal</Label>
              <Input id="monthly_value" name="monthly_value" type="number" step="0.01" placeholder="Ex: 2500.00" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_date" className="text-right">Data de Início</Label>
              <Input id="start_date" name="start_date" type="date" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_date" className="text-right">Data de Fim</Label>
              <Input id="end_date" name="end_date" type="date" className="col-span-3" />
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
