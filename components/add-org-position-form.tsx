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
import { addOrgPosition } from "@/app/dashboard/org-chart/actions"
import { toast } from "sonner"
import { ROLES } from "@/lib/constants"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

interface OrgPosition {
  id: string
  name: string
  role: string
}

interface AddOrgPositionFormProps {
  managerId?: string | null
  positions: OrgPosition[]
  children: React.ReactNode
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Posição"}
    </Button>
  )
}

export function AddOrgPositionForm({ managerId, positions, children }: AddOrgPositionFormProps) {
  const userRole = useRole(); // --- ALTERAÇÃO
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // --- ALTERAÇÃO ---
  if (userRole === "limited") return null;
  // ----------------

  async function handleFormSubmit(formData: FormData) {
    const result = await addOrgPosition(formData)

    if (result.error) {
      toast.error("Erro ao adicionar posição", { description: result.error })
    } else {
      toast.success(result.success)
      setOpen(false)
      formRef.current?.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* ... conteúdo do dialog (omitido, sem alterações) ... */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Posição</DialogTitle>
          <DialogDescription>Preencha os dados da nova posição no organograma.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Pessoa*</Label>
              <Input id="name" name="name" placeholder="Ex: João da Silva" required />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Cargo*</Label>
              <Select name="role" required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cargos Disponíveis</SelectLabel>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="manager_id">Gestor Direto</Label>
              <Select name="manager_id" defaultValue={managerId || "null"}>
                <SelectTrigger id="manager_id">
                  <SelectValue placeholder="Selecione um gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum (Liderança)</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name} ({pos.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
