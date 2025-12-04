"use server"

import { generateText } from "ai"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { format } from "date-fns"

const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Coleta um resumo completo de todos os dados de negócio do Supabase.
 */
async function getBusinessSnapshot() {
  const { data: clients } = await supabaseAdmin
    .from("clients")
    .select("name, status, contracts(name, end_date, status), nps_responses(score, response_date)")

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("name, status, payment_day, employee_payments(payment_date)")

  const snapshot = {
    current_date: format(new Date(), "yyyy-MM-dd"),
    clients,
    employees,
  }

  return JSON.stringify(snapshot, null, 2)
}

/**
 * Gera insights de negócio usando a IA com base em um snapshot dos dados.
 */
export async function getAiInsights() {
  const businessSnapshot = await getBusinessSnapshot()

  const systemPrompt = `
    Você é um analista de negócios sênior para uma agência de marketing. Sua tarefa é analisar um snapshot dos dados da empresa em formato JSON e gerar insights acionáveis, concisos e priorizados.

    **Regras:**
    1.  Foque em alertas críticos e oportunidades de negócio.
    2.  Use o formato de lista (bullet points).
    3.  Seja direto e objetivo.
    4.  Mencione nomes de clientes ou colaboradores quando relevante.
    5.  Se nenhum insight importante for encontrado, retorne a mensagem "Nenhum insight crítico ou oportunidade identificada no momento."
    6.  NÃO use formatação markdown (como negrito, itálico, # títulos, etc.). Use apenas texto simples.

    **Analise os seguintes pontos, com base na data atual (${format(new Date(), "dd/MM/yyyy")}):**
    - Contratos a Vencer: Identifique contratos de clientes ativos que irão expirar nos próximos 45 dias.
    - Contratos Expirados: Verifique se há clientes ativos com contratos já expirados.
    - Clientes em Risco: Aponte clientes com notas de NPS recentes (últimos 3 meses) abaixo de 7.
    - Pagamentos de Equipe: Verifique se o dia de pagamento de algum colaborador já passou no mês corrente e não há registro de pagamento.

    A seguir, os dados da empresa:
    ${businessSnapshot}
  `

  try {
    const { text } = await generateText({
      model: "gpt-oss-120b", // Modelo atualizado para GPT-OSS-120b
      prompt: systemPrompt,
      temperature: 0.5,
    })

    if (!text) {
      return { error: "A IA não conseguiu gerar insights." }
    }

    return { success: text }
  } catch (error) {
    console.error("Erro na API ao gerar insights:", error)
    return { error: "Ocorreu um erro ao se comunicar com a IA." }
  }
}

/**
 * Calcula métricas de saúde operacional baseadas na proporção clientes/funcionários
 */
export async function getOperationHealth() {
  // Buscar clientes ativos
  const { data: clients, count: activeClients } = await supabaseAdmin
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Buscar funcionários ativos por cargo
  const { data: employees } = await supabaseAdmin.from("employees").select("role, status").eq("status", "active")

  // Contar funcionários por cargo
  const roleCount: Record<string, number> = {}
  employees?.forEach((emp) => {
    roleCount[emp.role] = (roleCount[emp.role] || 0) + 1
  })

  // Regras de proporção ideal (clientes por funcionário)
  const idealRatios: Record<string, number> = {
    Editor: 10,
    Videomaker: 15,
    Assessor: 15,
    "Gestor de Relacionamento": 20,
  }

  // Calcular alertas de contratação
  const alerts: Array<{
    role: string
    current: number
    needed: number
    capacity: number
    status: "ok" | "warning" | "critical"
  }> = []

  Object.entries(idealRatios).forEach(([role, ratio]) => {
    const current = roleCount[role] || 0
    const capacity = current * ratio
    const needed = Math.ceil((activeClients || 0) / ratio) - current

    let status: "ok" | "warning" | "critical" = "ok"
    if (needed > 0) {
      status = "critical"
    } else if ((activeClients || 0) > capacity * 0.8) {
      status = "warning"
    }

    alerts.push({
      role,
      current,
      needed: Math.max(0, needed),
      capacity,
      status,
    })
  })

  return {
    activeClients: activeClients || 0,
    totalEmployees: employees?.length || 0,
    roleCount,
    alerts,
    overallRatio: employees?.length ? (activeClients || 0) / employees.length : 0,
  }
}
