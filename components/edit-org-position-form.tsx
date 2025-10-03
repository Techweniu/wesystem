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
import { updateOrgPosition } from "@/app/dashboard/org-chart/actions"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface OrgPosition {
  id: string;
  name: string;
  role: string;
  manager_id?: string | null;
}

interface EditOrgPositionFormProps {
  position: OrgPosition;
  allPositions: OrgPosition[];
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Alterações"}
    </Button>
  )
}

export function EditOrgPositionForm({ position, allPositions }: EditOrgPositionFormProps) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleFormSubmit(formData: FormData) {
    formData.append('positionId', position.id);
    const result = await updateOrgPosition(formData)

    if (result.error) {
      toast.error("Erro ao atualizar posição", { description: result.error })
    } else {
      toast.success(result.success)
      setOpen(false)
    }
  }
  
  // Filtra a lista de gestores para não incluir a própria pessoa
  const possibleManagers = allPositions.filter(p => p.id !== position.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-8 h-7 w-7 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Posição</DialogTitle>
          <DialogDescription>
            Atualize os dados desta posição no organograma.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Pessoa*</Label>
            <Input id="name" name="name" defaultValue={position.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Cargo*</Label>
            <Input id="role" name="role" defaultValue={position.role} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manager_id">Gestor Direto</Label>
            <Select name="manager_id" defaultValue={position.manager_id || 'null'}>
              <SelectTrigger id="manager_id">
                <SelectValue placeholder="Selecione um gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Nenhum (Liderança)</SelectItem>
                {possibleManagers.map(pos => (
                  <SelectItem key={pos.id} value={pos.id}>{pos.name} ({pos.role})</SelectItem>
                ))}
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
