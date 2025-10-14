"use client";

import { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { addEmployeeContribution } from "@/app/dashboard/team/actions";
import { PlusCircle } from "lucide-react";

interface AddEmployeeContributionFormProps {
  employeeId: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar Contribuição"}</Button>;
}

export function AddEmployeeContributionForm({ employeeId }: AddEmployeeContributionFormProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleFormSubmit(formData: FormData) {
    formData.append('employeeId', employeeId);
    const result = await addEmployeeContribution(formData);
    if (result.error) {
      toast.error("Erro ao registrar.", { description: result.error });
    } else {
      toast.success(result.success);
      formRef.current?.reset();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Registrar Contribuição
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Nova Contribuição</DialogTitle>
          <DialogDescription>Adicione um benefício que o colaborador trouxe para a empresa.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição*</Label>
            <Textarea id="description" name="description" required placeholder="Ex: Fechou contrato com a Empresa X, sugeriu nova ferramenta de gestão..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="category">Categoria*</Label>
                <Select name="category" required defaultValue="Venda">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Venda">Venda</SelectItem>
                    <SelectItem value="Upsell">Upsell</SelectItem>
                    <SelectItem value="Ideia">Ideia</SelectItem>
                    <SelectItem value="Melhoria de Processo">Melhoria de Processo</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="date">Data do Ocorrido*</Label>
                <Input id="date" name="date" type="date" required />
            </div>
          </div>
           <div className="grid gap-2">
              <Label htmlFor="value">Valor Monetário (Opcional)</Label>
              <Input id="value" name="value" type="number" step="0.01" min="0" placeholder="Ex: 5000.00" />
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
