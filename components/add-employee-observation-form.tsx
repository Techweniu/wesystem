"use client";

import { useState, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { addEmployeeObservation } from "@/app/dashboard/team/actions"
import { PlusCircle } from "lucide-react"
import { useRole } from "@/app/dashboard/layout"

interface AddEmployeeObservationFormProps {
  employeeId: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar Observação"}</Button>;
}

export function AddEmployeeObservationForm({ employeeId }: AddEmployeeObservationFormProps) {
  const userRole = useRole()
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (userRole === "limited") return null

  async function handleFormSubmit(formData: FormData) {
    formData.append('employeeId', employeeId);
    const result = await addEmployeeObservation(formData);
    if (result.error) {
      toast.error("Erro ao salvar", { description: result.error });
    } else {
      toast.success(result.success);
      formRef.current?.reset();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" />Adicionar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Observação</DialogTitle>
          <DialogDescription>Descreva o feedback sobre o colaborador.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="observation">Nova Observação</Label>
            <Textarea id="observation" name="observation" required placeholder="Escreva seu feedback aqui..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tag">Tipo de Registro</Label>
            <Select name="tag" required defaultValue="geral">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="feedback_positivo">Feedback Positivo</SelectItem>
                <SelectItem value="feedback_negativo">Feedback Negativo</SelectItem>
                <SelectItem value="reuniao_1_1">Reunião 1:1</SelectItem>
                <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="comportamento">Comportamento</SelectItem>
                <SelectItem value="geral">Geral</SelectItem>
              </SelectContent>
            </Select>
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
