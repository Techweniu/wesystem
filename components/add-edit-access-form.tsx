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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { saveAccess } from "@/app/dashboard/accesses/actions"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Acesso"}
    </Button>
  )
}

interface AccessFormData {
  id?: string
  platform_name: string
  username?: string | null
  password_info?: string | null
  department?: string | null
  client_name?: string | null
  client_id?: string | null
  notes?: string | null
}

interface AddEditAccessFormProps {
  access?: AccessFormData
  clientId?: string
  clientName?: string
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddEditAccessForm({
  access,
  clientId,
  clientName,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddEditAccessFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen

  const isEditing = !!access?.id

  async function handleFormSubmit(formData: FormData) {
    if (clientId) {
      formData.append("client_id", clientId)
      formData.append("client_name", clientName || "")
      formData.append("department", "Cliente")
    }

    if (access?.id) {
      formData.append("id", access.id)
    }

    const result = await saveAccess(formData)

    if (result.error) {
      toast.error("Erro ao salvar acesso.", {
        description: result.error,
      })
    } else {
      toast.success(result.success)
      setOpen(false)
      formRef.current?.reset()
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Acesso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Acesso" : "Adicionar Acesso"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações do acesso à plataforma." : "Adicione um novo acesso à plataforma."}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="platform_name">Nome da Plataforma*</Label>
            <Input
              id="platform_name"
              name="platform_name"
              placeholder="Ex: Google Ads, Facebook Business"
              defaultValue={access?.platform_name}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Usuário/Email</Label>
            <Input
              id="username"
              name="username"
              placeholder="Ex: usuario@empresa.com"
              defaultValue={access?.username || ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_info">Senha/Informação de Acesso</Label>
            <Input
              id="password_info"
              name="password_info"
              placeholder="Ex: senha123 ou 'Autenticação Google'"
              defaultValue={access?.password_info || ""}
            />
          </div>

          {!clientId && (
            <div className="grid gap-2">
              <Label htmlFor="department">Departamento*</Label>
              <Select name="department" defaultValue={access?.department || "Geral"} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Geral">Geral</SelectItem>
                  <SelectItem value="Diretoria">Diretoria</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Produção">Produção</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Notas adicionais sobre este acesso..."
              defaultValue={access?.notes || ""}
              rows={3}
            />
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
