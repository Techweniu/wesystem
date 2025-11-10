"use client";

import { useState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveAccess } from "@/app/dashboard/accesses/actions";
import { toast } from "sonner";
import type { PlatformAccess } from "@/app/dashboard/accesses/page";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/auth-context"; // <-- IMPORTA O HOOK DE AUTENTICAÇÃO
import { PlusCircle, Pencil } from "lucide-react"; // <-- Importa os ícones

// Props do componente
interface AddEditAccessFormProps {
  access?: PlatformAccess;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Botão de submit com estado de loading
function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Adicionar Acesso"}
    </Button>
  );
}

// Lista de departamentos
const departmentOptions = [
  { value: "Geral", label: "Nenhum / Geral" },
  { value: "Diretoria", label: "Diretoria" },
  { value: "Tecnologia", label: "Tecnologia" },
  { value: "Produção", label: "Produção" },
  { value: "Marketing", label: "Marketing" },
  { value: "Cliente", label: "Cliente" },
]

// Componente principal do formulário
export function AddEditAccessForm({ access, children, open: controlledOpen, onOpenChange: setControlledOpen }: AddEditAccessFormProps) {
  const { userRole } = useAuth(); // <-- OBTÉM A ROLE PELO CONTEXTO
  const [internalOpen, setInternalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [department, setDepartment] = useState(access?.department || 'Geral');
  const router = useRouter();

  const isEditing = !!access;
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  // Filtra as opções de departamento com base na role
  const visibleDepartmentOptions =
    userRole === "admin" ? departmentOptions : departmentOptions.filter((opt) => opt.value !== "Cliente");

  // Reseta o formulário e estado quando o dialog é aberto (para 'Adicionar')
  useEffect(() => {
    if (open && !isEditing) {
        formRef.current?.reset();
        setDepartment('Geral');
    } else if (open && isEditing) {
        setDepartment(access?.department || 'Geral');
    }
  }, [open, isEditing, access]);


  // Função chamada ao submeter o formulário
  async function handleFormSubmit(formData: FormData) {
    if (isEditing) {
      formData.append('id', access.id);
    }
    if (!formData.has('department')) {
        formData.set('department', department);
    }

    const result = await saveAccess(formData);

    if (result.error) {
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} acesso`, {
        description: result.error,
      });
    } else {
      toast.success(result.success);
      setOpen(false);
      router.refresh(); 
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Acesso' : 'Adicionar Novo Acesso'}</DialogTitle>
          <DialogDescription>
            Preencha as informações da plataforma. Lembre-se de não colocar senhas críticas diretamente.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          {isEditing && <input type="hidden" name="id" value={access.id} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="platform_name">Plataforma*</Label>
                <Input id="platform_name" name="platform_name" defaultValue={access?.platform_name} required placeholder="Ex: Google Workspace" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="username">Usuário/E-mail</Label>
                <Input id="username" name="username" defaultValue={access?.username || ''} placeholder="Ex: contato@empresa.com" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_info">Senha / Informação</Label>
            <Input id="password_info" name="password_info" defaultValue={access?.password_info || ''} placeholder="Dica, Autenticação 2 Fatores, etc."/>
          </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="department">Departamento</Label>
                <Select name="department" value={department} onValueChange={setDepartment}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {/* Usa as opções filtradas */}
                      {visibleDepartmentOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
             </div>
             {department === 'Cliente' && (
                <div className="grid gap-2">
                    <Label htmlFor="client_name">Nome do Cliente</Label>
                    <Input id="client_name" name="client_name" defaultValue={access?.client_name || ''} placeholder="Nome do Cliente" />
                </div>
             )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" defaultValue={access?.notes || ''} placeholder="Qualquer informação adicional relevante..." rows={3} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
