"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateClient } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

// A interface precisa conter todos os campos que podem ser editados neste formulário
interface ClientInfo {
  id: string; name: string; contact_email: string | null; contact_phone: string | null;
  status: "active" | "inactive"; health_status: "green" | "yellow" | "red" | null;
  cnpj: string | null; address: string | null; credit_risk: string | null;
}

interface EditClientInfoFormProps {
  client: ClientInfo;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar Alterações"}</Button>
}

export function EditClientInfoForm({ client }: EditClientInfoFormProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Informações do Cliente</DialogTitle>
        </DialogHeader>
        <form action={async (formData) => {
          const result = await updateClient(formData);
          if (result.error) toast.error("Erro", { description: result.error });
          else { toast.success(result.success); setOpen(false); }
        }}>
          <input type="hidden" name="clientId" value={client.id} />
           <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Cliente*</Label>
                <Input id="name" name="name" defaultValue={client.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label htmlFor="cnpj">CNPJ</Label><Input id="cnpj" name="cnpj" defaultValue={client.cnpj || ''} /></div>
                  <div className="grid gap-2"><Label htmlFor="address">Endereço</Label><Input id="address" name="address" defaultValue={client.address || ''} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label htmlFor="contact_email">Email</Label><Input id="contact_email" name="contact_email" type="email" defaultValue={client.contact_email || ''} /></div>
                  <div className="grid gap-2"><Label htmlFor="contact_phone">Telefone</Label><Input id="contact_phone" name="contact_phone" defaultValue={client.contact_phone || ''} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2"><Label htmlFor="status">Status*</Label><Select name="status" defaultValue={client.status} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent></Select></div>
                  <div className="grid gap-2"><Label htmlFor="health_status">Saúde*</Label><Select name="health_status" defaultValue={client.health_status || 'green'} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="green">🟢 Bom</SelectItem><SelectItem value="yellow">🟡 Atenção</SelectItem><SelectItem value="red">🔴 Crítico</SelectItem></SelectContent></Select></div>
                  <div className="grid gap-2"><Label htmlFor="credit_risk">Risco de Crédito</Label><Input id="credit_risk" name="credit_risk" defaultValue={client.credit_risk || ''} /></div>
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
