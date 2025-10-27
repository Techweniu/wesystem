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
import { Pencil, BarChart2 } from "lucide-react" // Adicionado BarChart2
import { Switch } from "@/components/ui/switch" // Importar o Switch
import { Separator } from "@/components/ui/separator" // Importar Separator

// Interface atualizada para incluir os novos campos
interface ClientInfo {
  id: string; name: string; contact_email: string | null; contact_phone: string | null;
  status: "active" | "inactive"; health_status: "green" | "yellow" | "red" | null;
  cnpj: string | null; address: string | null; credit_risk: string | null;
  has_traffic_service: boolean | null; // Novo
  ad_account_organized: boolean | null; // Novo
  ads_running: boolean | null;          // Novo
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
  // Estados locais para controlar os switches (necessário porque o Switch do Radix é controlado)
  const [hasTraffic, setHasTraffic] = useState(!!client.has_traffic_service);
  const [isOrganized, setIsOrganized] = useState(!!client.ad_account_organized);
  const [isRunning, setIsRunning] = useState(!!client.ads_running);

  // Resetar estados locais quando o diálogo é fechado ou aberto
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setHasTraffic(!!client.has_traffic_service);
      setIsOrganized(!!client.ad_account_organized);
      setIsRunning(!!client.ads_running);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* Botão de edição no topo da página de detalhes */}
        <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" />Editar Infos</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Informações do Cliente</DialogTitle>
          <DialogDescription>Atualize os dados gerais e de tráfego do cliente.</DialogDescription>
        </DialogHeader>
        <form action={async (formData) => {
          formData.append('clientId', client.id);
          // Adicionar os valores dos switches ao formData antes de enviar
          // O valor 'on' é padrão para checkboxes/switches marcados em HTML forms
          // Se desmarcado, o campo não é enviado, o Zod preprocess cuidará disso
          if (hasTraffic) formData.append('has_traffic_service', 'on');
          if (isOrganized) formData.append('ad_account_organized', 'on');
          if (isRunning) formData.append('ads_running', 'on');

          const result = await updateClient(formData);
          if (result.error) toast.error("Erro ao atualizar", { description: result.error });
          else { toast.success(result.success); setOpen(false); }
        }}>
           <div className="space-y-4 py-4 pr-2"> {/* Adicionado pr-2 para scrollbar */}
              {/* --- Campos Gerais --- */}
              <h4 className="text-sm font-semibold text-muted-foreground">Informações Gerais</h4>
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

              <Separator className="my-6" />

               {/* ====> NOVOS CAMPOS DE TRÁFEGO PAGO <==== */}
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" /> Status do Tráfego Pago
                 </h4>
                 {/* Switch para "Possui Tráfego?" */}
                 <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                   <Label htmlFor="has_traffic_service-switch" className="flex flex-col space-y-1 cursor-pointer"> {/* cursor-pointer */}
                     <span>Possui Serviço de Tráfego?</span>
                     <span className="font-normal leading-snug text-muted-foreground text-xs">
                       Marque se este cliente tem o serviço de tráfego ativo.
                     </span>
                   </Label>
                   {/* Associado ao Label pelo htmlFor */}
                   <Switch
                     id="has_traffic_service-switch"
                     checked={hasTraffic}
                     onCheckedChange={setHasTraffic}
                     aria-label="Possui Serviço de Tráfego"
                   />
                 </div>
                 {/* Switch para "Conta Organizada?" */}
                  <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                   <Label htmlFor="ad_account_organized-switch" className="flex flex-col space-y-1 cursor-pointer">
                     <span>Conta de Anúncios Organizada?</span>
                     <span className="font-normal leading-snug text-muted-foreground text-xs">
                       A estrutura da conta segue as boas práticas?
                     </span>
                   </Label>
                   <Switch
                     id="ad_account_organized-switch"
                     checked={isOrganized}
                     onCheckedChange={setIsOrganized}
                     aria-label="Conta de Anúncios Organizada"
                   />
                 </div>
                 {/* Switch para "Anúncios Rodando?" */}
                 <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                   <Label htmlFor="ads_running-switch" className="flex flex-col space-y-1 cursor-pointer">
                     <span>Anúncios Rodando?</span>
                     <span className="font-normal leading-snug text-muted-foreground text-xs">
                       Existem campanhas ativas no momento?
                     </span>
                   </Label>
                   <Switch
                     id="ads_running-switch"
                     checked={isRunning}
                     onCheckedChange={setIsRunning}
                     aria-label="Anúncios Rodando"
                   />
                 </div>
              </div>
               {/* ======================================= */}
           </div>
          <DialogFooter className="pt-4"> {/* Adicionado pt-4 */}
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
