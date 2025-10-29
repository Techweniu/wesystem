// sistema/components/mark-client-payment-button.tsx
"use client"; // Indica que é um Componente do Cliente (para interatividade)

import { useTransition } from "react"; // Hook para gerenciar estado de loading da ação
import { Button } from "@/components/ui/button"; // Componente de botão
import { CheckCircle, CircleDollarSign } from "lucide-react"; // Ícones
import { toast } from "sonner"; // Biblioteca para exibir notificações (toasts)
import { markClientPaymentAsPaid } from "@/app/dashboard/financial/actions"; // Importa a nova Server Action

// Define as propriedades que o componente espera receber
interface MarkClientPaymentButtonProps {
  clientId: string; // ID do cliente
  expectedAmount: number; // Valor esperado do pagamento
  isPaidThisMonth: boolean; // Indica se já foi pago neste mês
  // Opcional: Adicione activeContracts se precisar selecionar um contrato específico
  // activeContracts: Array<{id: string, name: string}>;
}

// Componente do botão
export function MarkClientPaymentButton({ clientId, expectedAmount, isPaidThisMonth }: MarkClientPaymentButtonProps) {
  const [isPending, startTransition] = useTransition(); // Hook para saber se a ação está em andamento

  // Função chamada quando o botão é clicado
  const handlePayment = () => {
    // Confirmação básica antes de registrar
    if (!confirm(`Confirma o recebimento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expectedAmount)}?`)) {
        return; // Cancela se o usuário clicar em "Cancelar"
    }

    const formData = new FormData(); // Cria um objeto FormData para enviar os dados para a action
    formData.append('clientId', clientId); // Adiciona o ID do cliente
    formData.append('amount', String(expectedAmount)); // Adiciona o valor (convertido para string)

    // Se precisar selecionar um contrato, adicione a lógica aqui para obter o ID selecionado
    // formData.append('contractId', selectedContractId);

    // Envolve a chamada da Server Action em startTransition para gerenciar o estado de loading
    startTransition(async () => {
      const result = await markClientPaymentAsPaid(formData); // Chama a action
      if (result.error) {
        // Exibe notificação de erro
        toast.error("Erro ao registrar pagamento", { description: result.error });
      } else {
        // Exibe notificação de sucesso
        toast.success(result.success);
        // A revalidação do cache acontece na Server Action, atualizando a tabela
      }
    });
  };

  // Se já foi pago este mês, exibe um texto indicando "Recebido"
  if (isPaidThisMonth) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-green-500"> {/* Estilo para indicar sucesso */}
        <CheckCircle className="h-4 w-4" />
        <span>Recebido</span>
      </div>
    );
  }

  // Se não foi pago, exibe o botão para marcar como recebido
  return (
    <Button
      size="sm" // Tamanho pequeno
      variant="outline" // Estilo de contorno
      onClick={handlePayment} // Função chamada no clique
      disabled={isPending || expectedAmount <= 0} // Desabilita se a ação estiver pendente ou se o valor for zero/negativo
      className="gap-1" // Adiciona espaço entre o ícone e o texto
    >
      {isPending ? (
          // Texto exibido durante o loading
          "Registrando..."
        ) : (
          // Ícone e texto do botão normal
          <>
            <CircleDollarSign className="h-4 w-4" /> {/* Ícone */}
            Marcar Recebido
          </>
        )
      }
    </Button>
  );
}
