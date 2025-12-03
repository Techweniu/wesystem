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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { addClient } from "@/app/dashboard/clients/actions"
import { toast } from "sonner"
import { PlusCircle, FileText, BarChart2, FileSignature } from "lucide-react"
import { ServicesMultiSelect } from "@/components/services-multi-select"
import { useRole } from "@/app/dashboard/layout"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Cadastrando..." : "Cadastrar Cliente Completo"}
    </Button>
  )
}

export function AddClientForm() {
  const userRole = useRole()
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Estado para arquivo do contrato
  const [fileName, setFileName] = useState<string | null>(null)

  // Se for limitado, não renderiza nada
  if (userRole === "limited") {
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileName(file ? file.name : null)
  }

  async function handleFormSubmit(formData: FormData) {
    const result = await addClient(formData)

    if (result.error) {
      toast.error("Erro ao criar cliente", { description: result.error })
    } else {
      toast.success(result.success)
      setOpen(false)
      formRef.current?.reset()
      setFileName(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha todas as informações iniciais do cliente, incluindo contrato e serviços.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <form ref={formRef} action={handleFormSubmit} className="p-6 space-y-8">
            
            {/* --- SEÇÃO 1: DADOS GERAIS --- */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">1</span>
                Informações Básicas
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Cliente *</Label>
                  <Input id="name" name="name" required placeholder="Ex: Empresa X" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input id="contact_email" name="contact_email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone</Label>
                  <Input id="contact_phone" name="contact_phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status Inicial *</Label>
                  <Select name="status" defaultValue="active" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_risk">Risco de Crédito</Label>
                  <Input id="credit_risk" name="credit_risk" placeholder="Ex: Baixo, Médio" />
                </div>
              </div>
            </div>

            <Separator />

            {/* --- SEÇÃO 2: CONTRATO E SERVIÇOS --- */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Contrato e Serviços
              </h4>
              
              <div className="grid gap-4 sm:grid-cols-2 bg-muted/20 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="contract_name">Nome do Contrato</Label>
                  <Input id="contract_name" name="contract_name" placeholder="Ex: Contrato Anual 2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_value">Valor Mensal (R$)</Label>
                  <Input id="contract_value" name="contract_value" type="number" step="0.01" min="0" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_start_date">Data de Início</Label>
                  <Input id="contract_start_date" name="contract_start_date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_end_date">Data Fim (Opcional)</Label>
                  <Input id="contract_end_date" name="contract_end_date" type="date" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="contract_file">Arquivo do Contrato (PDF)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="contract_file" 
                      name="contract_file" 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {fileName && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3" /> {fileName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {/* Aqui usamos o componente ServicesMultiSelect que já resolve o problema da lista */}
                <ServicesMultiSelect name="services" />
              </div>
            </div>

            <Separator />

            {/* --- SEÇÃO 3: TRÁFEGO PAGO --- */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Configuração de Tráfego
              </h4>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has_traffic_service" className="cursor-pointer">Serviço de Tráfego?</Label>
                    <Switch id="has_traffic_service" name="has_traffic_service" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ad_account_organized" className="cursor-pointer">Conta Organizada?</Label>
                    <Switch id="ad_account_organized" name="ad_account_organized" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ads_running" className="cursor-pointer">Anúncios Rodando?</Label>
                    <Switch id="ads_running" name="ads_running" />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* --- SEÇÃO 4: NOTAS --- */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client_notes">Notas Internas</Label>
                  <Textarea id="client_notes" name="client_notes" rows={3} placeholder="Observações sobre o cliente..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objetivos da Parceria</Label>
                  <Textarea id="objectives" name="objectives" rows={3} placeholder="O que o cliente espera alcançar..." />
                </div>
              </div>
            </div>

          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <SubmitButton />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
