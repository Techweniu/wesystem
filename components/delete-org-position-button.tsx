"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteOrgPosition } from "@/app/dashboard/org-chart/actions"

interface DeleteOrgPositionButtonProps {
  position: {
    id: string;
    name: string;
    role: string;
  };
}

export function DeleteOrgPositionButton({ position }: DeleteOrgPositionButtonProps) {
  
  const handleDelete = async () => {
    const formData = new FormData();
    formData.append('positionId', position.id);

    const result = await deleteOrgPosition(formData);

    if (result.error) {
      toast.error("Erro ao remover posição", { description: result.error });
    } else {
      toast.success(result.success);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação removerá permanentemente a posição de{" "}
            <span className="font-semibold text-foreground">{position.name} ({position.role})</span>{" "}
            do organograma. Todos os seus subordinados diretos passarão a ser lideranças. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Sim, remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
