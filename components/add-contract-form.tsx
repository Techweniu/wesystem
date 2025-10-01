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
import { addContract } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { PlusCircle, FileText } from "lucide-react"

interface AddContractFormProps {
  clientId: string;
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enviando..." : "Salvar Contrato"}
    </Button>
  )
}

export function AddContractForm({ clientId }: AddContractFormProps) {
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName(null);
    }
  };

  async function handleFormSubmit(formData: FormData) {
    formData.append('clientId', clientId);
    const result = await addContract(formData);

    if (result.error) {
      toast.error("Erro ao adicionar contrato.", {
        description: result.error,
      })
    } else {
      toast.success(result.success)
      setOpen(false)
      formRef.current?.reset()
      setFileName(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Contrato</DialogTitle>
          <DialogDescription>
            Faça o upload de um novo documento de contrato para este cliente.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contract_name">Nome do Contrato*</Label>
              <Input id="contract_name" name="contract_name" placeholder="Ex: Aditivo de Contrato Q4" required />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
                <Input id="valor_mensal" name="valor_mensal" type="number" step="0.01" min="0" placeholder="5000.00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="start_date">Data de Início*</Label>
                    <Input id="start_date" name="start_date" type="date" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="end_date">Data Fim</Label>
                    <Input id="end_date" name="end_date" type="date" />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contract_file">Arquivo (PDF)*</Label>
              <Input id="contract_file" name="contract_file" type="file" accept=".pdf" required onChange={handleFileChange} />
               {fileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <FileText className="h-4 w-4" />
                  <span>{fileName}</span>
                </div>
              )}
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
