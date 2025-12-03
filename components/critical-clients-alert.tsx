import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
}

export function CriticalClientsAlert({ clients }: { clients: Client[] }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Atenção Requerida</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
        <span>
          Você tem <strong>{clients.length} clientes</strong> marcados com saúde crítica:{" "}
          {clients.map(c => c.name).join(", ")}.
        </span>
        <Link href="/dashboard/clients" className="font-bold underline flex items-center gap-1 whitespace-nowrap">
           Ver Clientes <ArrowRight className="h-3 w-3" />
        </Link>
      </AlertDescription>
    </Alert>
  )
}
