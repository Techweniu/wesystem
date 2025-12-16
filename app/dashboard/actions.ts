"use server"

import { generateText } from "ai"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { format, subMonths } from "date-fns"

const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Coleta um resumo completo de todos os dados de negócio do Supabase.
 * Agora sincronizado com a mesma lógica detalhada do Chat Assistant.
 */
async function getFullBusinessSnapshot() {
  const today = new Date()
  const threeMonthsAgo = subMonths(today, 3)

  // Buscar todos os dados em paralelo para performance máxima e contexto total
  const [
    clientsResult,
    employeesResult,
    contractsResult,
    costsResult,
    npsResult,
    commercialGoalsResult,
    clientPaymentsResult,
    employeePaymentsResult,
    oneTimeServicesResult,
    clientUpsellsResult,
    timeLogsResult,
    platformAccessResult,
  ] = await Promise.all([
    // Clientes
    supabaseAdmin
      .from("clients")
      .select("id, name, status, health_status, credit_risk, objectives, client_notes, assigned_relationship_manager_id"),

    // Funcionários
    supabaseAdmin
      .from("employees")
      .select("id, name, role, status, payment_day, salary"),

    // Contratos
    supabaseAdmin
      .from("contracts")
      .select("id, name, client_id, start_date, end_date, status, valor_mensal, services, approval_status"),

    // Custos (últimos 6 meses)
    supabaseAdmin
      .from("costs")
      .select("id, description, value, category, date, status, approval_status, is_recurring")
      .gte("date", format(subMonths(today, 6), "yyyy-MM-dd")),

    // NPS
    supabaseAdmin
      .from("nps_responses")
      .select("client_id, score, comment, response_date")
      .order("response_date", { ascending: false })
      .limit(50),

    // Metas Comerciais
    supabaseAdmin.from("commercial_goals").select("*"),

    // Pagamentos de Clientes (últimos 3 meses)
    supabaseAdmin
      .from("client_payments")
      .select("client_id, amount, payment_date")
      .gte("payment_date", format(subMonths(today, 3), "yyyy-MM-dd")),

    // Pagamentos de Funcionários (últimos 2 meses)
    supabaseAdmin
      .from("employee_payments")
      .select("employee_id, amount, payment_date, approval_status")
      .gte("payment_date", format(subMonths(today, 2), "yyyy-MM-dd")),

    // Serviços Avulsos
    supabaseAdmin
      .from("one_time_services")
      .select("client_id, name, value, status, approval_status, date"),

    // Upsells
    supabaseAdmin
      .from("client_upsells")
      .select("client_id, status, services, notes, identified_date"),

    // Logs de Tempo (resumo recente)
    supabaseAdmin
      .from("time_logs")
      .select("employee_id, client_id, hours, date")
      .gte("date", format(subMonths(today, 1), "yyyy-MM-dd")),
      
    // Acessos
    supabaseAdmin
      .from("platform_access")
      .select("client_name, platform_name")
  ])

  const clients = clientsResult.data || []
  const employees = employeesResult.data || []
  const contracts = contractsResult.data || []
  const costs = costsResult.data || []
  const npsResponses = npsResult.data || []
  
  // Mapeamentos para enriquecimento rápido
  const clientMap = new Map(clients.map(c => [c.id, c.name]))
  const employeeMap = new Map(employees.map(e => [e.id, e.name]))

  // Estruturar dados para a IA (formato denso para economizar tokens, mas rico em info)
  const snapshot = {
    data_referencia: format(today, "dd/MM/yyyy"),
    resumo_financeiro: {
      custos_recentes: costs.map(c => ({
        desc: c.description,
        val: c.value,
        cat: c.category,
        status: c.status,
        aprovado: c.approval_status
      })),
      total_mrr: contracts.filter(c => c.status === 'active' && c.approval_status === 'approved').reduce((acc, c) => acc + (c.valor_mensal || 0), 0)
    },
    contratos_ativos: contracts.filter(c => c.status === 'active').map(c => ({
      cliente: clientMap.get(c.client_id),
      fim: c.end_date,
      aprovacao: c.approval_status,
      valor: c.valor_mensal
    })),
    clientes_risco_nps: npsResponses.filter(n => n.score < 7).map(n => ({
      cliente: clientMap.get(n.client_id),
      nota: n.score,
      data: n.response_date
    })),
    equipe_status: employees.map(e => ({
      nome: e.name,
      cargo: e.role,
      dia_pagto: e.payment_day,
      ativo: e.status === 'active'
    })),
    pagamentos_equipe_pendentes: employeePaymentsResult.data?.filter(p => p.approval_status === 'pending').map(p => ({
      funcionario: employeeMap.get(p.employee_id),
      valor: p.amount,
      data: p.payment_date
    })),
    oportunidades_upsell: clientUpsellsResult.data?.filter(u => u.status === 'identified').map(u => ({
      cliente: clientMap.get(u.client_id),
      servico: u.services
    })),
    servicos_avulsos_recentes: oneTimeServicesResult.data?.map(s => ({
      cliente: clientMap.get(s.client_id),
      nome: s.name,
      status: s.status,
      aprovacao: s.approval_status
    }))
  }

  return JSON.stringify(snapshot, null, 2)
}

/**
 * Gera insights de negócio usando a IA com base em um snapshot dos dados COMPLETO.
 */
export async function getAiInsights() {
  const businessSnapshot = await getFullBusinessSnapshot()

  const systemPrompt = `
    Você é um analista de negócios sênior para uma agência de marketing. Sua tarefa é analisar um snapshot JSON DETALHADO da empresa e gerar insights acionáveis.

    **Regras:**
    1. Foque em alertas críticos (financeiros, prazos, riscos) e oportunidades.
    2. Use bullet points simples.
    3. Seja direto.
    4. Se não houver insights críticos, diga "Operação estável, sem alertas críticos no momento."
    5. NÃO use markdown complexo (negrito/itálico). Apenas texto.

    **Analise com prioridade:**
    - **Contratos a Vencer:** Clientes ativos expirando em < 45 dias.
    - **Aprovações Pendentes:** Contratos, Custos ou Pagamentos marcados como 'pending' que precisam de atenção da diretoria.
    - **Risco de Churn:** Clientes com NPS baixo (< 7) recente ou health_status ruim.
    - **Oportunidades:** Upsells identificados não trabalhados.
    - **Financeiro:** Custos anormais ou serviços avulsos não recebidos.
    - **Equipe:** Pagamentos de equipe atrasados ou não aprovados.

    Dados da empresa:
    ${businessSnapshot}
  `

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
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
