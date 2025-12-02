"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
import { createClient } from "@/lib/supabase/client" // Import necessário para buscar clientes

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
  clientId: propClientId, // Renomeado para evitar conflito
  clientName: propClientName,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddEditAccessFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  
  // Estados para controle do departamento e clientes
  const [selectedDepartment, setSelectedDepartment] = useState<string>(access?.department || "Geral")
  const [clients, setClients] = useState<{id: string, name: string}[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen

  const isEditing = !!access?.id

  // Busca clientes se o departamento for "Cliente" e não tivermos um clientId fixo
  useEffect(() => {
    if (selectedDepartment === "Cliente" && !propClientId && open) {
      const fetchClients = async () => {
        setIsLoadingClients(true)
        const supabase = createClient()
        const { data } = await supabase
          .from("clients")
          .select("id, name")
          .eq("status", "active")
          .order("name")
        
        if (data) setClients(data)
        setIsLoadingClients(false)
      }
      fetchClients()
    }
  }, [selectedDepartment, propClientId, open])

  async function handleFormSubmit(formData: FormData) {
    // Se veio via props (página de detalhes do cliente), força os dados
    if (propClientId) {
      formData.append("client_id", propClientId)
      formData.append("client_name", propClientName || "")
      formData.append("department", "Cliente")
    }

    // Se selecionou um cliente no dropdown, precisamos pegar o nome dele também
    if (!propClientId && selectedDepartment === "Cliente") {
        const selectedClientId = formData.get("client_id") as string
        const selectedClient = clients.find(c => c.id === selectedClientId)
        if (selectedClient) {
            formData.append("client_name", selectedClient.name)
        }
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

          {/* Se não estivermos na página de um cliente específico, mostra o seletor de departamento */}
          {!propClientId && (
            <div className="grid gap-2">
              <Label htmlFor="department">Departamento*</Label>
              <Select 
                name="department" 
                defaultValue={access?.department || "Geral"} 
                onValueChange={setSelectedDepartment} // Atualiza estado para mostrar/esconder seletor de cliente
                required
              >
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

          {/* Seletor de Cliente Condicional (Só aparece se Departamento for Cliente e não houver propClientId) */}
          {!propClientId && selectedDepartment === "Cliente" && (
             <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
                <Label htmlFor="client_id">Vincular ao Cliente*</Label>
                <Select name="client_id" defaultValue={access?.client_id || ""} required>
                    <SelectTrigger disabled={isLoadingClients}>
                        <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione o cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
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
