"use client";

import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteAccess } from "@/app/dashboard/accesses/actions";
import { AddEditAccessForm } from "@/components/add-edit-access-form";
import type { PlatformAccess } from "@/app/dashboard/accesses/page";
// O hook useAuth não é mais necessário aqui, pois receberemos a role via props

// Props do componente ATUALIZADAS
interface AccessTableProps {
  accesses: PlatformAccess[];
  userRole: "admin" | "limited"; // <-- Recebe a role via props
}

// Componente do botão de exclusão com confirmação
function DeleteAccessButton({ accessId }: { accessId: string }) {
  const handleDelete = async () => {
    const formData = new FormData();
    formData.append('accessId', accessId);

    const result = await deleteAccess(formData); 

    if (result.error) {
      toast.error("Erro ao excluir acesso", { description: result.error });
    } else {
      toast.success(result.success);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover este acesso permanentemente? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Sim, excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Componente para exibir a senha/informação com botão de mostrar/ocultar
function PasswordDisplay({ info }: { info: string | null }) {
    const [isVisible, setIsVisible] = useState(false);

    if (!info) {
        return <span className="text-muted-foreground italic text-xs">Não informado</span>;
    }

    const looksLikePassword = info.length > 5 && !info.includes(' ') && !info.toLowerCase().includes('google') && !info.toLowerCase().includes('autentica');

    return (
        <div className="flex items-center gap-2 max-w-xs">
            {looksLikePassword ? (
                 <span className={`text-sm ${isVisible ? 'font-mono' : ''} truncate`}>
                    {isVisible ? info : '••••••••'}
                 </span>
            ) : (
                <span className="text-sm text-muted-foreground truncate">{info}</span>
            )}
            {looksLikePassword && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setIsVisible(!isVisible)}
                >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
             )}
        </div>
    );
}


// Componente principal da tabela
export function AccessTable({ accesses, userRole }: AccessTableProps) {
  const [editingAccessId, setEditingAccessId] = useState<string | null>(null);

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plataforma</TableHead>
            <TableHead>Usuário/Email</TableHead>
            <TableHead>Senha/Informação</TableHead>
            <TableHead>Departamento/Cliente</TableHead>
            <TableHead>Observações</TableHead>
            {/* Só mostra Ações para admin */}
            {userRole === "admin" && <TableHead className="text-right w-[100px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {accesses.length > 0 ? (
            accesses.map((access) => (
              <TableRow key={access.id}>
                <TableCell className="font-medium">{access.platform_name}</TableCell>
                <TableCell className="text-muted-foreground">{access.username || '-'}</TableCell>
                <TableCell>
                    <PasswordDisplay info={access.password_info} />
                </TableCell>
                <TableCell>
                  {access.department === 'Cliente' && access.client_name ? (
                     <Badge variant="secondary">{access.client_name} (Cliente)</Badge>
                  ) : access.department ? (
                     <Badge variant="outline">{access.department}</Badge>
                  ) : (
                     <Badge variant="outline">Geral</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {access.notes || '-'}
                </TableCell>
                {/* Só mostra Ações para admin */}
                {userRole === "admin" && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <AddEditAccessForm
                          access={access}
                          open={editingAccessId === access.id}
                          onOpenChange={(isOpen) => setEditingAccessId(isOpen ? access.id : null)}
                      >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                          </Button>
                      </AddEditAccessForm>
                      <DeleteAccessButton accessId={access.id} />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              {/* Ajusta o colSpan dinamicamente */}
              <TableCell colSpan={userRole === "admin" ? 6 : 5} className="h-24 text-center text-muted-foreground">
                Nenhum acesso encontrado para esta categoria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
