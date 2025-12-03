import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

interface Client {
  id: string
  name: string
  status: string
  created_at: string
  health_status: string
}

export function DashboardTopClientsTable({ clients }: { clients: Client[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Entrou em</TableHead>
          <TableHead>Saúde</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.length > 0 ? (
          clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-2 hover:underline">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {client.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(client.created_at), { addSuffix: true, locale: ptBR })}
              </TableCell>
               <TableCell>
                <Badge 
                   variant="outline" 
                   className={
                      client.health_status === "red" ? "border-red-500 text-red-500" : 
                      client.health_status === "yellow" ? "border-yellow-500 text-yellow-500" : 
                      "border-green-500 text-green-500"
                   }
                >
                  {client.health_status === "red" ? "Crítico" : client.health_status === "yellow" ? "Atenção" : "Bom"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={client.status === "active" ? "default" : "secondary"}>
                  {client.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        ) : (
           <TableRow>
             <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
               Nenhum cliente recente.
             </TableCell>
           </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
