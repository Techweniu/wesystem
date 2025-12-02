"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateClientNotes } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

interface ClientNotes {
  id: string;
  client_notes: string | null;
  objectives: string | null;
}

interface EditClientNotesFormProps {
  client: ClientNotes;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar Alterações"}</Button>
}

export function EditClientNotesForm({ client }: EditClientNotesFormProps) {
  const userRole = useRole(); // --- ALTERAÇÃO
  const [open, setOpen] = useState(false);

  // --- ALTERAÇÃO ---
  if (userRole === "limited") return null;
  // ----------------

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        {/* ... conteúdo do form (sem alterações) ... */}
        <DialogHeader>
          <DialogTitle>Editar Nota e Objetivos</DialogTitle>
        </DialogHeader>
        <form action={async (formData) => {
          formData.append('clientId', client.id);
          const result = await updateClientNotes(formData);
          if (result.error) toast.error("Erro", { description: result.error });
          else { toast.success(result.success); setOpen(false); }
        }}>
          <div className="space-y-4 py-4">
             <div className="grid gap-2">
                <Label htmlFor="client_notes">Nota do Cliente</Label>
                <Textarea id="client_notes" name="client_notes" defaultValue={client.client_notes || ''} rows={5} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="objectives">Objetivos com a Parceria</Label>
                <Textarea id="objectives" name="objectives" defaultValue={client.objectives || ''} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
