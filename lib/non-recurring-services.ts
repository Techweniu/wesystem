// Lista de serviços considerados não recorrentes/pontuais
export const NON_RECURRING_SERVICES = [
  'Produção e gestão de sites ou "landing pages"',
  "Árvore de links",
  "NIUcast",
  "Criação e gestão de e-commerce",
  "Cobertura audiovisual de eventos",
  "Produção de mídia para fins estranhos a este contrato",
  "Aluguel de estúdio",
  "Consultoria Comercial",
  "Criação e Gestão de canal no YouTube",
] as const

export function isNonRecurringService(serviceName: string): boolean {
  return NON_RECURRING_SERVICES.includes(serviceName as any)
}
