"use client";

import { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addEmployeeContract } from "@/app/dashboard/team/actions";
import { toast } from "sonner";
import { PlusCircle, FileText } from "lucide-react";
import { useRole } from "@/app/dashboard/layout"; // --- ALTERAÇÃO

interface AddEmployeeContractFormProps {
  employeeId: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Enviando..." : "Salvar Contrato"}</Button>;
}

export function AddEmployeeContractForm({ employeeId }: AddEmployeeContractFormProps) {
  const userRole = useRole(); // --- ALTERAÇÃO
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // --- ALTERAÇÃO ---
  if (userRole === "limited") return null;
  // ----------------

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
  };

  async function handleFormSubmit(formData: FormData) {
    formData.append('employeeId', employeeId);
    const result = await addEmployeeContract(formData);
    if (result.error) toast.error("Erro", { description: result.error });
    else { toast.success(result.success); setOpen(false); formRef.current?.reset(); setFileName(null); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Contrato</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* ... conteúdo do modal (sem alteração) ... */}
        <DialogHeader>
          <DialogTitle>Adicionar Novo Contrato</DialogTitle>
          <DialogDescription>Faça o upload de um novo documento.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="contract_name">Nome do Contrato*</Label>
            <Input id="contract_name" name="contract_name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contract_file">Arquivo (PDF)*</Label>
            <Input id="contract_file" name="contract_file" type="file" accept=".pdf" required onChange={handleFileChange} />
            {fileName && <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><FileText className="h-4 w-4" /><span>{fileName}</span></div>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
