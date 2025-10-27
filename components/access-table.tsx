"use client";

import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react"; // Adicionado Eye, EyeOff
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteAccess } from "@/app/dashboard/accesses/actions"; // Importa a ação de deletar
import { AddEditAccessForm } from "@/components/add-edit-access-form"; // Importa o formulário de edição/adição
import type { PlatformAccess } from "@/app/dashboard/accesses/page"; // Importa o tipo

// Props do componente
interface AccessTableProps {
  accesses: PlatformAccess[];
}

// Componente do botão de exclusão com confirmação
function DeleteAccessButton({ accessId }: { accessId: string }) {
  const handleDelete = async () => {
    const formData = new FormData();
    formData.append('accessId', accessId);

    const result = await deleteAccess(formData); // Chama a Server Action

    if (result.error) {
      toast.error("Erro ao excluir acesso", { description: result.error });
    } else {
      toast.success(result.success);
      // A revalidação do path na action deve atualizar a tabela
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
          {/* A AlertDialogAction aqui chama a função handleDelete */}
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

    // Heurística simples para verificar se parece ser uma senha real (pode ser ajustada)
    const looksLikePassword = info.length > 5 && !info.includes(' ') && !info.toLowerCase().includes('google') && !info.toLowerCase().includes('autentica');

    return (
        <div className="flex items-center gap-2 max-w-xs"> {/* Limita largura */}
            {looksLikePassword ? (
                 <span className={`text-sm ${isVisible ? 'font-mono' : ''} truncate`}> {/* Adiciona truncate */}
                    {isVisible ? info : '••••••••'}
                 </span>
            ) : (
                <span className="text-sm text-muted-foreground truncate">{info}</span> // Mostra direto se não parece senha
            )}
             {/* Mostra botão apenas se parecer senha */}
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
export function AccessTable({ accesses }: AccessTableProps) {
  // Estado para controlar qual diálogo de edição está aberto
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
            <TableHead className="text-right w-[100px]">Ações</TableHead>
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
                     <Badge variant="outline">Geral</Badge> // Mostra Geral se department for null
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate"> {/* Limita largura e trunca */}
                    {access.notes || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                     {/* Botão Editar: Abre o AddEditAccessForm em modo de edição */}
                    <AddEditAccessForm
                        access={access} // Passa os dados do acesso para preencher o form
                        open={editingAccessId === access.id} // Controla se este dialog específico está aberto
                        onOpenChange={(isOpen) => setEditingAccessId(isOpen ? access.id : null)} // Controla qual dialog abrir/fechar
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </AddEditAccessForm>
                    {/* Botão Excluir */}
                    <DeleteAccessButton accessId={access.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Nenhum acesso encontrado para esta categoria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
