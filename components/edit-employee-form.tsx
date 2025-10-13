"use client"

import { useRef } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveEmployee } from "@/app/dashboard/team/actions"
import { toast } from "sonner"
import { format } from "date-fns"

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  salary: number | null;
  hire_date: string;
  status: 'active' | 'inactive';
  manager_id: string | null;
  payment_day: number | null;
}

interface EditEmployeeFormProps {
  employee?: Employee;
  allEmployees: Omit<Employee, 'manager' | 'monthlyHours'>[];
  open: boolean; // Prop para controlar a visibilidade
  onOpenChange: (open: boolean) => void; // Prop para alterar a visibilidade
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Colaborador"}
    </Button>
  )
}

export function EditEmployeeForm({ employee, allEmployees, open, onOpenChange }: EditEmployeeFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const isEditing = !!employee;

  async function handleFormSubmit(formData: FormData) {
    const result = await saveEmployee(formData);
    if (result.error) {
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} colaborador`, { description: result.error });
    } else {
      toast.success(result.success);
      onOpenChange(false); // Fecha o dialog em caso de sucesso
      if (!isEditing) formRef.current?.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}</DialogTitle>
          <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-6">
          {employee && <input type="hidden" name="id" value={employee.id} />}
          <div className="grid gap-2"><Label htmlFor="name">Nome*</Label><Input id="name" name="name" defaultValue={employee?.name} required /></div>
          <div className="grid gap-2"><Label htmlFor="email">Email*</Label><Input id="email" name="email" type="email" defaultValue={employee?.email} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label htmlFor="role">Cargo*</Label><Input id="role" name="role" defaultValue={employee?.role} required /></div>
            <div className="grid gap-2"><Label htmlFor="department">Departamento</Label><Input id="department" name="department" defaultValue={employee?.department || ''} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label htmlFor="salary">Salário (R$)</Label><Input id="salary" name="salary" type="number" step="0.01" min="0" defaultValue={employee?.salary || ''} /></div>
            <div className="grid gap-2"><Label htmlFor="payment_day">Dia do Pagamento</Label><Input id="payment_day" name="payment_day" type="number" min="1" max="31" defaultValue={employee?.payment_day || ''} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="hire_date">Data de Contratação*</Label><Input id="hire_date" name="hire_date" type="date" defaultValue={employee ? format(new Date(employee.hire_date), 'yyyy-MM-dd') : ''} required /></div>
              <div className="grid gap-2"><Label htmlFor="status">Status*</Label><Select name="status" defaultValue={employee?.status || 'active'} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-2">
              <Label htmlFor="manager_id">Gestor Direto</Label>
              <Select name="manager_id" defaultValue={employee?.manager_id || 'null'}>
                <SelectTrigger><SelectValue placeholder="Selecione um gestor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum (Liderança)</SelectItem>
                  {allEmployees.filter(e => e.id !== employee?.id).map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
