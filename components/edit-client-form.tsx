"use client"

// ... imports anteriores
import { useState } from "react"
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
import { updateClient } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { Pencil, BarChart2, Users, Video, Film } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
// --- ALTERAÇÃO: Importar useRole ---
import { useRole } from "@/app/dashboard/layout"
// ----------------------------------

// ... interfaces

const SubmitButton = () => {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar Alterações"}
    </Button>
  )
}

export function EditClientInfoForm({
  client,
  assessors = [], 
  videomakers = [], 
  relationshipManagers = [], 
  editors = [], 
}: EditClientInfoFormProps) {
  const userRole = useRole() // --- ALTERAÇÃO: Pegar role
  const [open, setOpen] = useState(false)
  // ... estados locais

  // --- ALTERAÇÃO: Se for limitado, não renderiza ---
  if (userRole === "limited") {
    return null
  }
  // ------------------------------------------------

  // ... restante do componente (handleOpenChange e return)
  // (Omitindo o resto do código que já existe para economizar espaço, a lógica é idêntica ao anterior)
  
  const handleOpenChange = (isOpen: boolean) => {
    // ...
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Editar Infos
        </Button>
      </DialogTrigger>
      {/* ... conteúdo do Dialog ... */}
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
         {/* ... form ... */}
         <DialogHeader>
          <DialogTitle>Editar Informações do Cliente</DialogTitle>
          <DialogDescription>Atualize os dados gerais, de tráfego e responsáveis do cliente.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
             // ... lógica de submit
             const result = await updateClient(formData)
             // ...
             setOpen(false)
          }}
        >
           {/* ... campos ... */}
           <div className="space-y-4 py-4 pr-2">
              {/* ... */}
           </div>
           <DialogFooter className="pt-4">
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
