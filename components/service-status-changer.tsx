"use client"

import { useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { updateServiceStatus } from "@/app/dashboard/clients/[id]/actions"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

type Service = {
  id: string;
  clientId: string;
  status: 'pending' | 'completed' | 'cancelled';
}

// Mapeia os status para cores e textos
const statusConfig = {
  completed: { label: "Concluído", variant: "default" as const },
  pending: { label: "Pendente", variant: "secondary" as const },
  cancelled: { label: "Cancelado", variant: "destructive" as const },
}

export function ServiceStatusChanger({ service }: { service: Service }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: 'pending' | 'completed' | 'cancelled') => {
    startTransition(async () => {
      const result = await updateServiceStatus({
        serviceId: service.id,
        clientId: service.clientId,
        status: newStatus
      });

      if (result.error) {
        toast.error("Erro ao atualizar status", { description: result.error });
      } else {
        toast.success(result.success);
        router.refresh(); // Força a atualização da UI
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant={statusConfig[service.status].variant} 
          className="cursor-pointer hover:opacity-80 transition-opacity"
          aria-disabled={isPending}
        >
          {isPending ? "Alterando..." : statusConfig[service.status].label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(statusConfig).map(([statusKey, { label }]) => (
          <DropdownMenuItem 
            key={statusKey}
            disabled={service.status === statusKey || isPending}
            onClick={() => handleStatusChange(statusKey as 'pending' | 'completed' | 'cancelled')}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
