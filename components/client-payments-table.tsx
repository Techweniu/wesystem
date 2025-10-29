// sistema/components/client-payments-table.tsx
"use client"; // Indica que é um Componente do Cliente

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Componentes da tabela
import { Badge } from "@/components/ui/badge"; // Componente Badge para status
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Componentes de Card
import Link from "next/link"; // Componente Link para navegação
import { MarkClientPaymentButton } from "./mark-client-payment-button"; // Importa o botão criado no passo anterior

// Define a estrutura dos dados esperados para cada linha da tabela
interface ClientPaymentInfo {
  clientId: string;
  clientName: string;
  expectedAmount: number;
  isPaidThisMonth: boolean;
  nextPaymentDate: string | null;
  activeContracts: Array<{id: string, name: string}>; // Passa contratos caso precise no futuro
}

// Define as propriedades que a tabela espera receber
interface ClientPaymentsTableProps {
  clientPayments: ClientPaymentInfo[]; // Um array com as informações de pagamento
}

// Componente da tabela
export function ClientPaymentsTable({ clientPayments }: ClientPaymentsTableProps) {

  return (
    <Card> {/* Envolve a tabela em um Card */}
      <CardHeader>
        <CardTitle>Próximos Pagamentos de Clientes (Baseado no MRR)</CardTitle>
        {/* Adicionar filtros aqui depois, se necessário */}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border"> {/* Borda arredondada em volta da tabela */}
          <Table>
            <TableHeader> {/* Cabeçalho da tabela */}
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Próximo Vencimento</TableHead>
                <TableHead className="text-right">Valor Esperado (MRR)</TableHead>
                <TableHead className="text-center">Status (Mês Atual)</TableHead>
                <TableHead className="text-center w-[180px]">Ação</TableHead> {/* Coluna de Ação */}
              </TableRow>
            </TableHeader>
            <TableBody> {/* Corpo da tabela */}
              {/* Verifica se há dados de pagamento para exibir */}
              {clientPayments.length > 0 ? (
                // Mapeia cada item de pagamento para uma linha da tabela
                clientPayments.map((payment) => (
                  <TableRow key={payment.clientId}> {/* Linha da tabela */}
                    <TableCell className="font-medium">
                        {/* Link para a página de detalhes do cliente */}
                        <Link href={`/dashboard/clients/${payment.clientId}`} className="hover:underline">
                            {payment.clientName}
                        </Link>
                    </TableCell>
                    <TableCell>
                        {/* Exibe a próxima data de pagamento ou um texto padrão */}
                        {payment.nextPaymentDate || <span className="text-muted-foreground italic">Não definido</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {/* Formata o valor esperado como moeda */}
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payment.expectedAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                       {/* Exibe um Badge com o status do pagamento */}
                       <Badge variant={payment.isPaidThisMonth ? "default" : "secondary"}>
                           {payment.isPaidThisMonth ? "Recebido" : "Aguardando"}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {/* Renderiza o botão "Marcar Recebido" */}
                      <MarkClientPaymentButton
                        clientId={payment.clientId}
                        expectedAmount={payment.expectedAmount}
                        isPaidThisMonth={payment.isPaidThisMonth}
                        // activeContracts={payment.activeContracts} // Passar se necessário
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Linha exibida se não houver pagamentos esperados
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum pagamento esperado de clientes ativos com contrato mensal.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
