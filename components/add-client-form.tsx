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
import { Textarea } from "@/components/ui/textarea"
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
    if (file) { setFileName(file.name); } 
    else { setFileName(null); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>Preencha todos os dados do cliente e do contrato inicial.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Informações Gerais</h4>
           <div className="grid gap-2">
            <Label htmlFor="name">Nome do Cliente*</Label>
            <Input id="name" name="name" required />
          </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" name="cnpj" />
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" name="address" />
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_email">Email de Contato</Label>
              <Input id="contact_email" name="contact_email" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_phone">Telefone</Label>
              <Input id="contact_phone" name="contact_phone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status*</Label>
              <Select name="status" defaultValue="active" required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="credit_risk">Risco de Crédito</Label>
                <Input id="credit_risk" name="credit_risk" />
            </div>
          </div>
           <h4 className="text-sm font-semibold text-muted-foreground pt-4 border-t">Notas e Objetivos</h4>
           <div className="grid gap-2">
                <Label htmlFor="client_notes">Nota do Cliente</Label>
                <Textarea id="client_notes" name="client_notes" rows={3} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="objectives">Objetivos com a Parceria</Label>
                <Textarea id="objectives" name="objectives" rows={3} />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Contrato Inicial (Opcional)</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contract_name">Nome do Contrato</Label>
                  <Input id="contract_name" name="contract_name" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
                    <Input id="valor_mensal" name="valor_mensal" type="number" step="0.01" min="0" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="start_date">Data de Início</Label>
                        <Input id="start_date" name="start_date" type="date" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="end_date">Data Fim</Label>
                        <Input id="end_date" name="end_date" type="date" />
                    </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contract_file">Arquivo do Contrato (PDF)</Label>
                  <Input id="contract_file" name="contract_file" type="file" accept=".pdf" className="file:text-foreground" onChange={handleFileChange} />
                  {fileName && ( <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><FileText className="h-4 w-4" /><span>{fileName}</span></div> )}
                </div>
              </div>
            </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
