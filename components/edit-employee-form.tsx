"use client"

import type React from "react"

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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveEmployee } from "@/app/dashboard/team/actions"
import { toast } from "sonner"
import { format } from "date-fns"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string | null
  salary: number | null
  hire_date: string
  status: "active" | "inactive"
  manager_id: string | null
  payment_day: number | null
}

interface EditEmployeeFormProps {
  employee?: Employee
  allEmployees: Omit<Employee, "manager" | "monthlyHours">[]
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// Lista de Cargos (atualizada)
const rolesList = [
  "Diretor de Operações",
  "Diretor de Relacionamento com Cliente",
  "Diretor de Marketing",
  "Diretor de Tecnologia",
  "Diretor de Audiovisual",
  "Diretor Comercial",
  "Gestor de Relacionamento",
  "Videomaker",
  "Editor", // <-- ADICIONADO AQUI
  "Assessor",
  "Colaborador de Tecnologia",
  "Backoffice",
  "Representante Comercial",
]

// Lista de Departamentos (sem alterações)
const departmentsList = ["Diretoria", "Tecnologia", "Edição", "Assessoria", "Audiovisual"]

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Colaborador"}
    </Button>
  )
}

export function EditEmployeeForm({
  employee,
  allEmployees,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: EditEmployeeFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const isEditing = !!employee
  const open = controlledOpen ?? internalOpen
  const setOpen = setControlledOpen ?? setInternalOpen

  // Usa 'none' como valor para representar 'null' no Select
  const defaultDepartmentValue = employee?.department ?? "none"

  async function handleFormSubmit(formData: FormData) {
    // Se 'none' foi selecionado para departamento, remove explicitamente para que a action o trate como null
    if (formData.get("department") === "none") {
      formData.delete("department") // Ou formData.set('department', '') dependendo da validação
    }
    const result = await saveEmployee(formData)
    if (result.error) {
      toast.error(`Erro ao ${isEditing ? "atualizar" : "criar"} colaborador`, { description: result.error })
    } else {
      toast.success(result.success)
      setOpen(false)
      if (!isEditing) formRef.current?.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Colaborador" : "Adicionar Novo Colaborador"}</DialogTitle>
          <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-6">
          {employee && <input type="hidden" name="id" value={employee.id} />}
          {/* Campos Nome e Email (sem alterações) */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome*</Label>
            <Input id="name" name="name" defaultValue={employee?.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email*</Label>
            <Input id="email" name="email" type="email" defaultValue={employee?.email} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Campo Cargo (Select - atualizado) */}
            <div className="grid gap-2">
              <Label htmlFor="role">Cargo*</Label>
              <Select name="role" defaultValue={employee?.role} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cargos Disponíveis</SelectLabel>
                    {rolesList.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {/* Campo Departamento (Select - sem alterações) */}
            <div className="grid gap-2">
              <Label htmlFor="department">Departamento</Label>
              <Select name="department" defaultValue={defaultDepartmentValue}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Departamentos</SelectLabel>
                    {/* Opção para Nenhum/Remover */}
                    <SelectItem value="none">Nenhum</SelectItem>
                    {departmentsList.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Restante dos campos (Salário, Dia Pagamento, Data Contratação, Status, Gestor) sem alterações */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="salary">Salário (R$)</Label>
              <Input
                id="salary"
                name="salary"
                type="number"
                step="0.01"
                min="0"
                defaultValue={employee?.salary || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment_day">Dia do Pagamento</Label>
              <Input
                id="payment_day"
                name="payment_day"
                type="number"
                min="1"
                max="31"
                defaultValue={employee?.payment_day || ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="hire_date">Data de Contratação*</Label>
              <Input
                id="hire_date"
                name="hire_date"
                type="date"
                defaultValue={employee ? format(new Date(employee.hire_date), "yyyy-MM-dd") : ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status*</Label>
              <Select name="status" defaultValue={employee?.status || "active"} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manager_id">Gestor Direto</Label>
            <Select name="manager_id" defaultValue={employee?.manager_id || "null"}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Nenhum (Liderança)</SelectItem>
                {allEmployees
                  .filter((e) => e.id !== employee?.id)
                  .map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
