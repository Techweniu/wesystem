"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateClient } from "@/app/dashboard/clients/[id]/actions" // Ação será atualizada no próximo passo
import { toast } from "sonner"
import { Pencil, BarChart2, Users, Video } from "lucide-react" // Adicionado Users, Video
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

// Interface para funcionários (usada nas props)
interface EmployeeOption {
  id: string;
  name: string;
}

// Interface atualizada para incluir os IDs e as listas de opções
interface ClientInfo {
  id: string; name: string; contact_email: string | null; contact_phone: string | null;
  status: "active" | "inactive"; health_status: "green" | "yellow" | "red" | null;
  cnpj: string | null; address: string | null; credit_risk: string | null;
  has_traffic_service: boolean | null;
  ad_account_organized: boolean | null;
  ads_running: boolean | null;
  assigned_assessor_id: string | null; // Novo ID
  assigned_videomaker_id: string | null; // Novo ID
}

interface EditClientInfoFormProps {
  client: ClientInfo;
  assessors: EmployeeOption[]; // Lista de assessores disponíveis
  videomakers: EmployeeOption[]; // Lista de videomakers disponíveis
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar Alterações"}</Button>
}

export function EditClientInfoForm({ client, assessors, videomakers }: EditClientInfoFormProps) {
  const [open, setOpen] = useState(false);
  // Estados locais para switches
  const [hasTraffic, setHasTraffic] = useState(!!client.has_traffic_service);
  const [isOrganized, setIsOrganized] = useState(!!client.ad_account_organized);
  const [isRunning, setIsRunning] = useState(!!client.ads_running);
  // Estados locais para Selects (opcional, mas bom para controle)
  const [selectedAssessor, setSelectedAssessor] = useState(client.assigned_assessor_id ?? 'null'); // 'null' como string para o Select
  const [selectedVideomaker, setSelectedVideomaker] = useState(client.assigned_videomaker_id ?? 'null'); // 'null' como string

  // Resetar estados locais ao abrir/fechar
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setHasTraffic(!!client.has_traffic_service);
      setIsOrganized(!!client.ad_account_organized);
      setIsRunning(!!client.ads_running);
      setSelectedAssessor(client.assigned_assessor_id ?? 'null');
      setSelectedVideomaker(client.assigned_videomaker_id ?? 'null');
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" />Editar Infos</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Informações do Cliente</DialogTitle>
          <DialogDescription>Atualize os dados gerais, de tráfego e responsáveis do cliente.</DialogDescription>
        </DialogHeader>
        <form action={async (formData) => {
          formData.append('clientId', client.id);
          // Adiciona booleanos
          if (hasTraffic) formData.append('has_traffic_service', 'on');
          if (isOrganized) formData.append('ad_account_organized', 'on');
          if (isRunning) formData.append('ads_running', 'on');
          // Adiciona IDs dos responsáveis (o Select já envia o valor correto se tiver 'name')
          // Garantir que os campos sejam enviados mesmo se 'null' for selecionado
          formData.set('assigned_assessor_id', selectedAssessor);
          formData.set('assigned_videomaker_id', selectedVideomaker);


          const result = await updateClient(formData); // Ação precisa ser atualizada
          if (result.error) toast.error("Erro ao atualizar", { description: result.error });
          else { toast.success(result.success); setOpen(false); }
        }}>
           <div className="space-y-4 py-4 pr-2">
              {/* --- Campos Gerais --- */}
              <h4 className="text-sm font-semibold text-muted-foreground">Informações Gerais</h4>
              {/* ... (Nome, CNPJ, Endereço, Email, Telefone, Status, Saúde, Risco - sem alterações) ... */}
              <div className="grid gap-2"><Label htmlFor="name">Nome*</Label><Input id="name" name="name" defaultValue={client.name} required /></div>
              <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="cnpj">CNPJ</Label><Input id="cnpj" name="cnpj" defaultValue={client.cnpj || ''} /></div><div className="grid gap-2"><Label htmlFor="address">Endereço</Label><Input id="address" name="address" defaultValue={client.address || ''} /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="contact_email">Email</Label><Input id="contact_email" name="contact_email" type="email" defaultValue={client.contact_email || ''} /></div><div className="grid gap-2"><Label htmlFor="contact_phone">Telefone</Label><Input id="contact_phone" name="contact_phone" defaultValue={client.contact_phone || ''} /></div></div>
              <div className="grid grid-cols-3 gap-4"><div className="grid gap-2"><Label htmlFor="status">Status*</Label><Select name="status" defaultValue={client.status} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="health_status">Saúde*</Label><Select name="health_status" defaultValue={client.health_status || 'green'} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="green">🟢 Bom</SelectItem><SelectItem value="yellow">🟡 Atenção</SelectItem><SelectItem value="red">🔴 Crítico</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="credit_risk">Risco</Label><Input id="credit_risk" name="credit_risk" defaultValue={client.credit_risk || ''} /></div></div>


              <Separator className="my-6" />

               {/* --- Campos de Tráfego Pago (Switches - sem alterações) --- */}
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Status do Tráfego Pago</h4>
                 <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><Label htmlFor="has_traffic_service-switch" className="flex flex-col space-y-1 cursor-pointer"><span>Possui Tráfego?</span><span className="font-normal text-muted-foreground text-xs">...</span></Label><Switch id="has_traffic_service-switch" checked={hasTraffic} onCheckedChange={setHasTraffic}/></div>
                 <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><Label htmlFor="ad_account_organized-switch" className="flex flex-col space-y-1 cursor-pointer"><span>Conta Organizada?</span><span className="font-normal text-muted-foreground text-xs">...</span></Label><Switch id="ad_account_organized-switch" checked={isOrganized} onCheckedChange={setIsOrganized}/></div>
                 <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm"><Label htmlFor="ads_running-switch" className="flex flex-col space-y-1 cursor-pointer"><span>Anúncios Rodando?</span><span className="font-normal text-muted-foreground text-xs">...</span></Label><Switch id="ads_running-switch" checked={isRunning} onCheckedChange={setIsRunning}/></div>
              </div>

               <Separator className="my-6" />

               {/* ====> NOVOS CAMPOS DE RESPONSÁVEIS (SELECTS) <==== */}
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Responsáveis Atribuídos</h4>
                 <div className="grid grid-cols-2 gap-4">
                    {/* Select para Assessor */}
                    <div className="grid gap-2">
                        <Label htmlFor="assigned_assessor_id">Assessor Principal</Label>
                        {/* Controla o valor com o estado local */}
                        <Select name="assigned_assessor_id" value={selectedAssessor} onValueChange={setSelectedAssessor}>
                            <SelectTrigger id="assigned_assessor_id">
                                <SelectValue placeholder="Selecione um Assessor" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Opção para remover/nenhum */}
                                <SelectItem value="null">Nenhum</SelectItem>
                                {assessors.map(assessor => (
                                    <SelectItem key={assessor.id} value={assessor.id}>
                                        {assessor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Select para Videomaker */}
                    <div className="grid gap-2">
                        <Label htmlFor="assigned_videomaker_id">Videomaker Principal</Label>
                        {/* Controla o valor com o estado local */}
                         <Select name="assigned_videomaker_id" value={selectedVideomaker} onValueChange={setSelectedVideomaker}>
                            <SelectTrigger id="assigned_videomaker_id">
                                <SelectValue placeholder="Selecione um Videomaker" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Opção para remover/nenhum */}
                                <SelectItem value="null">Nenhum</SelectItem>
                                {videomakers.map(vm => (
                                    <SelectItem key={vm.id} value={vm.id}>
                                        {vm.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
              </div>
               {/* ============================================== */}
           </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
