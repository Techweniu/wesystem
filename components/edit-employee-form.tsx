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
import { ROLES, DEPARTMENTS, WORK_MODELS, OFFICE_LOCATIONS } from "@/lib/constants"
import { useRole } from "@/app/dashboard/layout"
import { MapPin, Briefcase } from "lucide-react"

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
  work_model?: "presential" | "home_office" | null
  office_location?: "Itumbiara" | "Uberlândia" | null
}

interface EditEmployeeFormProps {
  employee?: Employee
  allEmployees: Omit<Employee, "manager" | "monthlyHours">[]
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

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
  const userRole = useRole(); 
  const [internalOpen, setInternalOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Estado para controlar a exibição condicional do local
  const [workModel, setWorkModel] = useState<string>(employee?.work_model || "presential")

  if (userRole === "limited") return null;

  const isEditing = !!employee
  const open = controlledOpen ?? internalOpen
  const setOpen = setControlledOpen ?? setInternalOpen

  const defaultDepartmentValue = employee?.department ?? "none"

  async function handleFormSubmit(formData: FormData) {
    if (formData.get("department") === "none") {
      formData.delete("department") 
    }
    const result = await saveEmployee(formData)
    if (result.error) {
      toast.error(`Erro ao ${isEditing ? "atualizar" : "criar"} colaborador`, { description: result.error })
    } else {
      toast.success(result.success)
      setOpen(false)
      if (!isEditing) {
        formRef.current?.reset()
        setWorkModel("presential") // Reseta para o padrão
      }
    }
  }

  // Manipulador para quando o modal abre/fecha (para resetar estados se necessário)
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && employee) {
      setWorkModel(employee.work_model || "presential")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Colaborador" : "Adicionar Novo Colaborador"}</DialogTitle>
          <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-6">
          {employee && <input type="hidden" name="id" value={employee.id} />}
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nome*</Label>
            <Input id="name" name="name" defaultValue={employee?.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email*</Label>
            <Input id="email" name="email" type="email" defaultValue={employee?.email} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Cargo*</Label>
              <Select name="role" defaultValue={employee?.role} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cargos Disponíveis</SelectLabel>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Departamento</Label>
              <Select name="department" defaultValue={defaultDepartmentValue}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Departamentos</SelectLabel>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* --- NOVOS CAMPOS: MODELO DE TRABALHO E LOCAL --- */}
          <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-md">
            <div className="grid gap-2">
              <Label htmlFor="work_model" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Modelo *
              </Label>
              <Select 
                name="work_model" 
                defaultValue={workModel} 
                onValueChange={setWorkModel}
                required
              >
                <SelectTrigger id="work_model">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Renderização Condicional do Local */}
            {workModel === "presential" && (
              <div className="grid gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <Label htmlFor="office_location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Unidade *
                </Label>
                <Select 
                  name="office_location" 
                  defaultValue={employee?.office_location || undefined} 
                  required={workModel === "presential"}
                >
                  <SelectTrigger id="office_location">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFICE_LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {/* ------------------------------------------------ */}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="salary">Salário (R$)</Label>
              <Input id="salary" name="salary" type="number" step="0.01" min="0" defaultValue={employee?.salary || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment_day">Dia do Pagamento</Label>
              <Input id="payment_day" name="payment_day" type="number" min="1" max="31" defaultValue={employee?.payment_day || ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="hire_date">Data de Contratação*</Label>
              <Input id="hire_date" name="hire_date" type="date" defaultValue={employee ? format(new Date(employee.hire_date), "yyyy-MM-dd") : ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status*</Label>
              <Select name="status" defaultValue={employee?.status || "active"} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <SelectTrigger><SelectValue placeholder="Selecione um gestor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Nenhum (Liderança)</SelectItem>
                {allEmployees.filter((e) => e.id !== employee?.id).map((pos) => (
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
