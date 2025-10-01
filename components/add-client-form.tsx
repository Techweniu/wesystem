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
import { PlusCircle, FileText } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar Cliente"}
    </Button>
  )
}

export function AddClientForm() {
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleFormSubmit(formData: FormData) {
    const result = await addClient(formData)

    if (result.error) {
      toast.error("Erro ao criar cliente", { description: result.error })
    } else {
      toast.success(result.success)
      setOpen(false)
      formRef.current?.reset()
      setFileName(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName(null);
    }
  };

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
          <DialogDescription>Preencha os dados do cliente e anexe o contrato inicial (opcional).</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Dados do Cliente */}
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

            {/* Dados do Contrato */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Contrato Inicial (Opcional)</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contract_name">Nome do Contrato</Label>
                  <Input id="contract_name" name="contract_name" placeholder="Ex: Contrato de Marketing Digital 2025" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
                  <Input id="valor_mensal" name="valor_mensal" type="number" step="0.01" min="0" placeholder="5000.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contract_file">Arquivo do Contrato (PDF)</Label>
                  <Input id="contract_file" name="contract_file" type="file" accept=".pdf" className="file:text-foreground" onChange={handleFileChange} />
                  {fileName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <FileText className="h-4 w-4" />
                      <span>{fileName}</span>
                    </div>
                  )}
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
