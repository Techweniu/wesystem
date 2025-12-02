"use client";

import { useState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addClient } from "@/app/dashboard/clients/actions";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
// --- ALTERAÇÃO: Importar o hook useRole ---
import { useRole } from "@/app/dashboard/layout";
// ------------------------------------------

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar Cliente"}
    </Button>
  );
}

export function AddClientForm() {
  // --- ALTERAÇÃO: Verificar permissão ---
  const userRole = useRole();
  // ------------------------------------
  
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableServices, setAvailableServices] = useState<OptionType[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // --- ALTERAÇÃO: Se for limitado, não renderiza nada ---
  if (userRole === "limited") {
    return null;
  }
  // -----------------------------------------------------

  useEffect(() => {
    async function fetchServices() {
      if (open) {
        setIsLoadingServices(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("services")
          .select("id, name")
          .order("name");

        if (error) {
          console.error("Error fetching services:", error);
          toast.error("Erro ao carregar serviços disponíveis.");
          setAvailableServices([]);
        } else {
          setAvailableServices(
            data.map((service) => ({
              value: service.id,
              label: service.name,
            }))
          );
        }
        setIsLoadingServices(false);
      }
    }
    fetchServices();
  }, [open]); 

  async function handleFormSubmit(formData: FormData) {
    selectedServices.forEach((serviceId) => {
      formData.append("service_ids[]", serviceId);
    });

    const result = await addClient(formData);

    if (result.error) {
      toast.error("Erro ao criar cliente", { description: result.error });
    } else {
      toast.success(result.success);
      setOpen(false);
      formRef.current?.reset();
      setSelectedServices([]);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente e selecione os serviços contratados.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Informações Gerais
          </h4>
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Cliente*</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_email">Email de Contato</Label>
              <Input id="contact_email" name="contact_email" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_phone">Telefone</Label>
              <Input id="contact_phone" name="contact_phone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status*</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="credit_risk">Risco de Crédito</Label>
              <Input id="credit_risk" name="credit_risk" />
            </div>
          </div>
          <h4 className="text-sm font-semibold text-muted-foreground pt-4 border-t">
            Notas e Objetivos
          </h4>
          <div className="grid gap-2">
            <Label htmlFor="client_notes">Nota do Cliente</Label>
            <Textarea id="client_notes" name="client_notes" rows={3} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="objectives">Objetivos com a Parceria</Label>
            <Textarea id="objectives" name="objectives" rows={3} />
          </div>

           <div className="border-t pt-4">
             <h4 className="text-sm font-semibold text-muted-foreground mb-3">Serviços Contratados</h4>
             {isLoadingServices ? (
                <Skeleton className="h-10 w-full" />
             ) : (
                <MultiSelect
                    options={availableServices}
                    selected={selectedServices}
                    onChange={setSelectedServices}
                    placeholder="Selecione os serviços..."
                    className="w-full"
                />
             )}
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
  );
}
