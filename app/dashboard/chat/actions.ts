"use server"

import { generateText } from "ai"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { format, subMonths } from "date-fns"

async function checkAdminPermission() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  if (role !== "admin") {
    throw new Error("Acesso negado: Apenas a diretoria pode consultar o assistente.")
  }
}

type Message = {
  role: "user" | "assistant"
  content: string
}

async function getFullBusinessContext() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const today = new Date()
  const threeMonthsAgo = subMonths(today, 3)

  // Buscar todos os dados em paralelo para performance
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
    employeeContributionsResult,
    employeeObservationsResult,
    costCategoriesResult,
  ] = await Promise.all([
    // Clientes com contatos
    supabaseAdmin
      .from("clients")
      .select(`
        id, name, status, health_status, credit_risk, contact_email, contact_phone,
        has_traffic_service, ad_account_organized, ads_running, objectives, client_notes,
        assigned_editor_id, assigned_assessor_id, assigned_videomaker_id, assigned_relationship_manager_id,
        client_contacts(name, role, email, phone)
      `),

    // Funcionários com pagamentos e contratos
    supabaseAdmin
      .from("employees")
      .select(`
        id, name, email, role, department, status, salary, hire_date, payment_day,
        work_model, office_location, career_plan_expiration_date, position_expiration_date,
        manager_id
      `),

    // Contratos com entregas e status de aprovação
    supabaseAdmin
      .from("contracts")
      .select(`
        id, name, client_id, start_date, end_date, status, valor_mensal, services,
        approval_status, approved_by, approved_at,
        contract_deliverables(service_name, delivery_date, delivered)
      `),

    // Custos (últimos 6 meses para análise) com status de aprovação
    supabaseAdmin
      .from("costs")
      .select(`
        id, description, value, category, subcategory, date, paid_date, status,
        is_recurring, cost_type, payment_method, employee_id, notes,
        approval_status, approved_by, approved_at
      `)
      .gte("date", format(subMonths(today, 6), "yyyy-MM-dd"))
      .order("date", { ascending: false }),

    // NPS responses
    supabaseAdmin
      .from("nps_responses")
      .select(`
        id, client_id, score, comment, observations, category_scores, response_date
      `)
      .order("response_date", { ascending: false }),

    // Metas comerciais
    supabaseAdmin
      .from("commercial_goals")
      .select("*"),

    // Pagamentos de clientes (últimos 6 meses)
    supabaseAdmin
      .from("client_payments")
      .select("id, client_id, contract_id, amount, payment_date, notes")
      .gte("payment_date", format(subMonths(today, 6), "yyyy-MM-dd"))
      .order("payment_date", { ascending: false }),

    // Pagamentos de funcionários (últimos 3 meses) com status de aprovação
    supabaseAdmin
      .from("employee_payments")
      .select("id, employee_id, amount, payment_date, approval_status, approved_by")
      .gte("payment_date", format(subMonths(today, 3), "yyyy-MM-dd"))
      .order("payment_date", { ascending: false }),

    // Serviços avulsos com status de aprovação
    supabaseAdmin
      .from("one_time_services")
      .select("id, client_id, name, value, date, status, services, received_date, approval_status, approved_by")
      .order("date", { ascending: false }),

    // Oportunidades de upsell
    supabaseAdmin
      .from("client_upsells")
      .select("id, client_id, status, services, notes, identified_date"),

    // Logs de tempo (último mês)
    supabaseAdmin
      .from("time_logs")
      .select("id, client_id, employee_id, contract_id, hours, description, date")
      .gte("date", format(subMonths(today, 1), "yyyy-MM-dd")),

    // Acessos de plataforma
    supabaseAdmin
      .from("platform_access")
      .select("id, client_id, client_name, platform_name, department"),

    // Contribuições de funcionários com aprovação
    supabaseAdmin
      .from("employee_contributions")
      .select("id, employee_id, value, category, description, date, approval_status")
      .gte("date", format(subMonths(today, 3), "yyyy-MM-dd")),

    // Observações de funcionários
    supabaseAdmin
      .from("employee_observations")
      .select("id, employee_id, observation, tag, created_at")
      .order("created_at", { ascending: false })
      .limit(50),

    // Categorias de custo
    supabaseAdmin
      .from("cost_categories")
      .select("id, name, color, description"),
  ])

  const clients = clientsResult.data || []
  const employees = employeesResult.data || []
  const contracts = contractsResult.data || []
  const costs = costsResult.data || []
  const npsResponses = npsResult.data || []
  const commercialGoals = commercialGoalsResult.data || []
  const clientPayments = clientPaymentsResult.data || []
  const employeePayments = employeePaymentsResult.data || []
  const oneTimeServices = oneTimeServicesResult.data || []
  const clientUpsells = clientUpsellsResult.data || []
  const timeLogs = timeLogsResult.data || []
  const platformAccess = platformAccessResult.data || []
  const employeeContributions = employeeContributionsResult.data || []
  const employeeObservations = employeeObservationsResult.data || []
  const costCategories = costCategoriesResult.data || []

  // Calcular métricas agregadas
  const activeClients = clients.filter((c) => c.status === "active")
  const activeEmployees = employees.filter((e) => e.status === "active")
  const activeContracts = contracts.filter((c) => c.status === "active" && c.approval_status === "approved")

  const mrrTotal = activeContracts.reduce((acc, c) => acc + Number(c.valor_mensal || 0), 0)
  const totalCosts6Months = costs.reduce((acc, c) => acc + Number(c.value || 0), 0)
  const avgNps = npsResponses.length > 0 ? npsResponses.reduce((acc, n) => acc + n.score, 0) / npsResponses.length : 0
  const totalSalaries = activeEmployees.reduce((acc, e) => acc + Number(e.salary || 0), 0)
  const oneTimeRevenue = oneTimeServices
    .filter((s) => s.status === "received" && s.approval_status === "approved")
    .reduce((acc, s) => acc + Number(s.value || 0), 0)

  // Criar mapa de funcionários para referência
  const employeeMap = new Map(employees.map((e) => [e.id, e.name]))
  const clientMap = new Map(clients.map((c) => [c.id, c.name]))

  // Enriquecer dados com nomes
  const enrichedClients = activeClients.map((c) => ({
    nome: c.name,
    status: c.status,
    saude: c.health_status,
    risco_credito: c.credit_risk,
    email: c.contact_email,
    telefone: c.contact_phone,
    tem_trafego: c.has_traffic_service,
    anuncios_rodando: c.ads_running,
    objetivos: c.objectives,
    notas: c.client_notes,
    contatos: c.client_contacts,
    editor_responsavel: c.assigned_editor_id ? employeeMap.get(c.assigned_editor_id) : null,
    assessor_responsavel: c.assigned_assessor_id ? employeeMap.get(c.assigned_assessor_id) : null,
    videomaker_responsavel: c.assigned_videomaker_id ? employeeMap.get(c.assigned_videomaker_id) : null,
    gestor_relacionamento: c.assigned_relationship_manager_id
      ? employeeMap.get(c.assigned_relationship_manager_id)
      : null,
  }))

  const enrichedContracts = contracts.map((c) => ({
    nome: c.name,
    cliente: clientMap.get(c.client_id),
    inicio: c.start_date,
    fim: c.end_date,
    status: c.status,
    aprovacao: c.approval_status,
    valor_mensal: c.valor_mensal,
    servicos: c.services,
    entregas: c.contract_deliverables,
  }))

  const enrichedEmployees = activeEmployees.map((e) => ({
    nome: e.name,
    email: e.email,
    cargo: e.role,
    departamento: e.department,
    salario: e.salary,
    dia_pagamento: e.payment_day,
    data_contratacao: e.hire_date,
    modelo_trabalho: e.work_model,
    local_trabalho: e.office_location,
    vencimento_plano_carreira: e.career_plan_expiration_date,
    vencimento_cargo: e.position_expiration_date,
    gestor: e.manager_id ? employeeMap.get(e.manager_id) : null,
  }))

  const enrichedNps = npsResponses.slice(0, 30).map((n) => ({
    cliente: clientMap.get(n.client_id),
    nota: n.score,
    comentario: n.comment,
    observacoes: n.observations,
    notas_por_categoria: n.category_scores,
    data: n.response_date,
  }))

  const enrichedCosts = costs.slice(0, 50).map((c) => ({
    descricao: c.description,
    valor: c.value,
    categoria: c.category,
    subcategoria: c.subcategory,
    data: c.date,
    status: c.status,
    aprovacao: c.approval_status,
    tipo: c.cost_type,
    recorrente: c.is_recurring,
    funcionario: c.employee_id ? employeeMap.get(c.employee_id) : null,
    notas: c.notes,
  }))

  const enrichedUpsells = clientUpsells.map((u) => ({
    cliente: clientMap.get(u.client_id),
    status: u.status,
    servicos: u.services,
    notas: u.notes,
    data_identificacao: u.identified_date,
  }))

  const enrichedTimeLogs = timeLogs.map((t) => ({
    cliente: clientMap.get(t.client_id),
    funcionario: employeeMap.get(t.employee_id),
    horas: t.hours,
    descricao: t.description,
    data: t.date,
  }))

  // Funcionários por cargo
  const employeesByRole: Record<string, string[]> = {}
  activeEmployees.forEach((e) => {
    if (!employeesByRole[e.role]) employeesByRole[e.role] = []
    employeesByRole[e.role].push(e.name)
  })

  // Clientes em risco (NPS baixo recente)
  const clientesEmRisco = npsResponses
    .filter((n) => n.score < 7 && new Date(n.response_date) >= threeMonthsAgo)
    .map((n) => ({
      cliente: clientMap.get(n.client_id),
      nota: n.score,
      data: n.response_date,
    }))

  // Contratos a vencer (próximos 45 dias)
  const contratosAVencer = contracts
    .filter((c) => {
      if (c.status !== "active" || !c.end_date) return false
      const endDate = new Date(c.end_date)
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays > 0 && diffDays <= 45
    })
    .map((c) => ({
      cliente: clientMap.get(c.client_id),
      contrato: c.name,
      vencimento: c.end_date,
      valor: c.valor_mensal,
    }))

  return {
    data_atual: format(today, "dd/MM/yyyy"),

    resumo_executivo: {
      total_clientes_ativos: activeClients.length,
      total_funcionarios_ativos: activeEmployees.length,
      total_contratos_ativos: activeContracts.length,
      mrr_mensal: mrrTotal,
      custo_total_6_meses: totalCosts6Months,
      folha_salarial_mensal: totalSalaries,
      nps_medio: avgNps.toFixed(1),
      receita_servicos_avulsos: oneTimeRevenue,
      lucro_estimado_mensal: mrrTotal - totalSalaries,
    },

    alertas: {
      clientes_em_risco: clientesEmRisco,
      contratos_a_vencer_45_dias: contratosAVencer,
      oportunidades_upsell: enrichedUpsells.filter((u) => u.status === "identified"),
    },

    equipe: {
      por_cargo: employeesByRole,
      lista_completa: enrichedEmployees,
    },

    clientes: enrichedClients,

    contratos: enrichedContracts,

    financeiro: {
      custos_recentes: enrichedCosts,
      categorias_custo: costCategories,
      metas_comerciais: commercialGoals,
      pagamentos_clientes_recentes: clientPayments.slice(0, 20).map((p) => ({
        cliente: clientMap.get(p.client_id),
        valor: p.amount,
        data: p.payment_date,
      })),
      servicos_avulsos: oneTimeServices.map((s) => ({
        cliente: clientMap.get(s.client_id),
        nome: s.name,
        valor: s.value,
        status: s.status,
        aprovacao: s.approval_status,
        data: s.date,
      })),
    },

    nps_avaliacoes: enrichedNps,

    registro_horas: enrichedTimeLogs,

    acessos_plataforma: platformAccess.map((a) => ({
      cliente: a.client_name || clientMap.get(a.client_id),
      plataforma: a.platform_name,
      departamento: a.department,
    })),

    contribuicoes_funcionarios: employeeContributions.map((c) => ({
      funcionario: employeeMap.get(c.employee_id),
      valor: c.value,
      categoria: c.category,
      descricao: c.description,
      aprovacao: c.approval_status,
      data: c.date,
    })),

    observacoes_funcionarios: employeeObservations.map((o) => ({
      funcionario: employeeMap.get(o.employee_id),
      observacao: o.observation,
      tag: o.tag,
    })),
  }
}

export async function generateChatResponse(messages: Message[]) {
  try {
    await checkAdminPermission()

    const lastMessage = messages[messages.length - 1]
    const userQuestion = lastMessage.content

    const businessContext = await getFullBusinessContext()

    const conversationHistory = messages
      .slice(0, -1)
      .map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
      .join("\n")

    const systemPrompt = `
Você é um assistente de BI empresarial chamado "Wesystem AI" - um analista de negócios sênior para uma agência de marketing digital.

DATA ATUAL: ${businessContext.data_atual}

=== DADOS COMPLETOS DA EMPRESA ===

${JSON.stringify(businessContext, null, 2)}

=== FIM DOS DADOS ===

HISTÓRICO DA CONVERSA:
${conversationHistory}

INSTRUÇÕES:
1. Você tem acesso COMPLETO a todos os dados da empresa: clientes, funcionários, contratos, custos, NPS, metas comerciais, horas trabalhadas, acessos, etc.
2. Responda com base APENAS nos dados fornecidos. NÃO invente informações.
3. Se perguntarem sobre funcionários, use a lista em "equipe".
4. Se perguntarem sobre valores financeiros, use o "resumo_executivo" e "financeiro".
5. Se perguntarem sobre clientes específicos, busque na lista de "clientes".
6. Se perguntarem sobre alertas ou riscos, verifique a seção "alertas".
7. Considere o campo 'aprovacao' (approval_status) para contratos, custos e serviços. Se algo está 'pending', alerte que ainda não foi aprovado.
8. Seja direto, profissional e forneça dados específicos quando disponíveis.
9. Mencione nomes, valores e datas quando relevante.
10. Se não encontrar a informação solicitada nos dados, informe claramente.
`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `${systemPrompt}\n\nPergunta do Usuário: ${userQuestion}`,
      temperature: 0.3,
    })

    return { success: text }
  } catch (error) {
    console.error("Erro no Chat:", error)
    return { error: error instanceof Error ? error.message : "Erro ao processar mensagem." }
  }
}
