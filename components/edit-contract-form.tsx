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
import { updateContract } from "@/app/dashboard/clients/[id]/actions" 
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

interface Contract {
  id: string;
  name: string;
  valor_mensal: number;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'inactive' | null;
}

interface EditContractFormProps {
  contract: Contract;
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Alterações"}
    </Button>
  )
}

export function EditContractForm({ contract }: EditContractFormProps) {
  const userRole = useRole(); // --- ALTERAÇÃO
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // --- ALTERAÇÃO ---
  if (userRole === "limited") return null;
  // ----------------

  const formattedStartDate = contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '';
  const formattedEndDate = contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : '';

  async function handleFormSubmit(formData: FormData) {
    formData.append('contractId', contract.id);
    const result = await updateContract(formData);

    if (result.error) {
      toast.error("Erro ao atualizar contrato.", {
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* ... conteúdo do form (omitido, sem alterações) ... */}
        <DialogHeader>
          <DialogTitle>Editar Contrato</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do contrato.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Contrato*</Label>
            <Input id="name" name="name" defaultValue={contract.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
            <Input id="valor_mensal" name="valor_mensal" type="number" step="0.01" min="0" defaultValue={contract.valor_mensal} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Data de Início*</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={formattedStartDate} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">Data Fim</Label>
              <Input id="end_date" name="end_date" type="date" defaultValue={formattedEndDate} />
            </div>
          </div>
           <div className="grid gap-2">
              <Label htmlFor="status">Status do Contrato*</Label>
              <Select name="status" defaultValue={contract.status || 'active'} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
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
