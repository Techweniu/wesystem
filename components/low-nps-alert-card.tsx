// Em wesystem6/components/low-nps-alert-card.tsx
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

// Define a estrutura mínima do cliente que o componente espera
interface ClientRanked {
  id: string
  name: string
  latestNps?: number // NPS pode ser undefined se o cliente não tiver resposta
}

interface LowNpsAlertCardProps {
  rankedClients: ClientRanked[] // Recebe a lista já ranqueada (menor NPS primeiro)
  count?: number // Quantos clientes mostrar (opcional, padrão 5)
}

export function LowNpsAlertCard({ rankedClients, count = 5 }: LowNpsAlertCardProps) {
  // Filtra clientes que são Detratores (<= 7) ou Neutros (== 8)
  const clientsNeedingAttention = rankedClients
    .filter((c) => c.latestNps !== undefined && c.latestNps <= 8)
    .slice(0, count) // Pega os 'count' piores (já estão ordenados)

  // Se não houver clientes nessa faixa para mostrar, não renderiza o card
  if (clientsNeedingAttention.length === 0) {
    return null
  }

  // Função para determinar a variante do Badge com base no NPS
  const getNpsBadgeVariant = (nps: number): "destructive" | "secondary" => {
    if (nps <= 7) return "destructive" // Detrator
    return "secondary" // Neutro (Passivo)
  }

  return (
    // Usando o componente Alert para dar destaque visual
    <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-destructive-foreground dark:text-foreground">
        Clientes Detratores e Neutros Precisando de Atenção
      </AlertTitle>
      <AlertDescription className="text-foreground/90">
        Revise a situação dos seguintes clientes (ordenados por menor NPS):
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {clientsNeedingAttention.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="flex items-center gap-2 hover:underline text-foreground font-medium"
            >
              <span className="text-sm">{client.name}</span>
              <Badge variant={getNpsBadgeVariant(client.latestNps!)}>{client.latestNps}</Badge>
            </Link>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}
