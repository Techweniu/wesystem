// Em wesystem6/components/critical-clients-alert.tsx
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Define a estrutura mínima do cliente que o componente espera
interface Client {
  id: string;
  name: string;
  health_status: 'green' | 'yellow' | 'red' | null;
}

interface CriticalClientsAlertProps {
  clients: Client[];
}

export function CriticalClientsAlert({ clients }: CriticalClientsAlertProps) {
  // Filtra apenas os clientes com status 'red'
  const criticalClients = clients.filter(client => client.health_status === 'red');

  // Se não houver clientes críticos, não mostra nada
  if (criticalClients.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Atenção: Clientes em Estado Crítico!</AlertTitle>
      <AlertDescription>
        Os seguintes clientes precisam de atenção imediata: {' '}
        {criticalClients.map((client, index) => (
          <span key={client.id}>
            <Link href={`/dashboard/clients/${client.id}`} className="font-semibold underline hover:no-underline">
              {client.name}
            </Link>
            {index < criticalClients.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </AlertDescription>
    </Alert>
  );
}
