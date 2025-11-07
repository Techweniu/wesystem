// Caminho: wesystem10/app/dashboard/clients/[id]/actions.ts
"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { isNonRecurringService } from "@/lib/non-recurring-services"

// --- Action para Serviço Pontual (MODIFICADA) ---
const oneTimeServiceSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  name: z.string().min(1, "O nome do serviço é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.string().min(1, "A data é obrigatória."),
  status: z.enum(["pending", "completed", "cancelled"], {
    errorMap: () => ({ message: "Status inválido." }),
  }),
  // services: z.string().optional(), // <-- CAMPO REMOVIDO DO SCHEMA
})

export async function addOneTimeService(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())
  const validatedFields = oneTimeServiceSchema.safeParse(rawFormData)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }
  // 'services' removido da desestruturação
  const { clientId, name, value, date, status } = validatedFields.data

  // Lógica do 'servicesArray' removida
  // const servicesArray = services ? JSON.parse(services) : []

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin.from("one_time_services").insert([
    {
      client_id: clientId,
      name,
      value,
      date,
      status,
      // 'services: servicesArray' removido do insert
    },
  ])
  if (error) {
    console.error("Erro Supabase (addOneTimeService):", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath("/dashboard/clients")
  revalidatePath("/dashboard/financial") // Adicionado para garantir que o financeiro atualize
  return { success: "Serviço pontual adicionado com sucesso!" }
}

// ... (Restante do arquivo 'actions.ts' sem alterações) ...

// --- Action para o NPS Interno ---
const npsSchema = z.object({
  clientId: z.string().uuid(),
  // Validar cada categoria individualmente
  "Conteúdos e Roteiros": z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  Audiovisual: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  "Edição de Vídeos": z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  Design: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  "Atendimento Assessor": z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  "Atendimento VideoMaker": z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  "Comunicação e Presença": z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  "Resultado da Parceria": z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  observations: z.string().optional(),
})

export async function addNpsResponse(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validatedFields = npsSchema.safeParse(rawData)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos. Verifique as notas." }
  }
  const { clientId, observations, ...categoryScores } = validatedFields.data
  const scores = Object.values(categoryScores)
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin.from("nps_responses").insert([
    {
      client_id: clientId,
      score: Math.round(averageScore), // Salva a média arredondada
      category_scores: categoryScores, // Salva o JSON com as notas individuais
      observations: observations || null, // Garante que seja null se vazio
      response_date: new Date().toISOString().slice(0, 10), // Data atual YYYY-MM-DD
    },
  ])
  if (error) {
    console.error("Erro Supabase (addNpsResponse):", error)
    return { error: `Ocorreu um erro ao salvar a avaliação: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Avaliação NPS salva com sucesso!" }
}

// --- Action para Atualizar Informações Gerais do Cliente ---
// VERIFIQUE ESTE SCHEMA E LÓGICA
const updateClientSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  name: z.string().min(3, "O nome do cliente é obrigatório.").optional(),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")), // Poderia adicionar validação de formato de telefone
  status: z.enum(["active", "inactive", "prospect"]).optional(),
  health_status: z.enum(["green", "yellow", "red"]).optional(),
  cnpj: z.string().optional().or(z.literal("")), // Poderia adicionar validação de formato CNPJ
  address: z.string().optional().or(z.literal("")),
  credit_risk: z.string().optional().or(z.literal("")),
  // Campos booleanos (pré-processamento para converter 'on'/undefined para boolean)
  has_traffic_service: z.preprocess((val) => val === "on", z.boolean()).optional(),
  ad_account_organized: z.preprocess((val) => val === "on", z.boolean()).optional(),
  ads_running: z.preprocess((val) => val === "on", z.boolean()).optional(),
  // Campos de ID dos responsáveis (UUID opcional ou 'null' string ou null/undefined)
  assigned_assessor_id: z.string().uuid("ID de assessor inválido.").or(z.literal("null")).optional().nullable(),
  assigned_videomaker_id: z.string().uuid("ID de videomaker inválido.").or(z.literal("null")).optional().nullable(),
  assigned_relationship_manager_id: z
    .string()
    .uuid("ID de gestor inválido.")
    .or(z.literal("null"))
    .optional()
    .nullable(),
})

export async function updateClient(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())

  // Trata explicitamente os valores 'null' (string) dos selects antes da validação
  if (rawFormData.assigned_assessor_id === "null") {
    rawFormData.assigned_assessor_id = null
  }
  if (rawFormData.assigned_videomaker_id === "null") {
    rawFormData.assigned_videomaker_id = null
  }
  if (rawFormData.assigned_relationship_manager_id === "null") {
    rawFormData.assigned_relationship_manager_id = null
  }

  const validatedFields = updateClientSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Erro de validação Zod (updateClient):", validatedFields.error.flatten().fieldErrors)
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }

  // Extrai os campos validados
  const {
    clientId,
    has_traffic_service,
    ad_account_organized,
    ads_running,
    assigned_assessor_id, // Já está como UUID ou null
    assigned_videomaker_id, // Já está como UUID ou null
    assigned_relationship_manager_id, // Já está como UUID ou null
    ...updateData
  } = validatedFields.data

  // Monta o objeto final para atualização no banco
  const dataToUpdate: Record<string, any> = {
    ...updateData,
    // Usa ?? false para garantir que o valor seja boolean (false se undefined/null)
    has_traffic_service: has_traffic_service ?? false,
    ad_account_organized: ad_account_organized ?? false,
    ads_running: ads_running ?? false,
    // Inclui os IDs dos responsáveis (serão null se não selecionados)
    assigned_assessor_id: assigned_assessor_id,
    assigned_videomaker_id: assigned_videomaker_id,
    assigned_relationship_manager_id: assigned_relationship_manager_id,
    updated_at: new Date().toISOString(), // Atualiza timestamp
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Busca o valor ANTERIOR dos responsáveis para revalidação
  let previousAssessorId: string | null = null
  let previousVideomakerId: string | null = null
  let previousManagerId: string | null = null
  const { data: previousClientData } = await supabaseAdmin
    .from("clients")
    .select("assigned_assessor_id, assigned_videomaker_id, assigned_relationship_manager_id")
    .eq("id", clientId)
    .maybeSingle()

  if (previousClientData) {
    previousAssessorId = previousClientData.assigned_assessor_id
    previousVideomakerId = previousClientData.assigned_videomaker_id
    previousManagerId = previousClientData.assigned_relationship_manager_id
  }

  // Atualiza o cliente
  const { error } = await supabaseAdmin
    .from("clients")
    .update(dataToUpdate) // Atualiza com os dados preparados
    .eq("id", clientId) // Filtra pelo ID do cliente

  if (error) {
    console.error("Erro Supabase (updateClient):", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  // Revalida (limpa cache) das páginas relevantes
  revalidatePath(`/dashboard/clients/${clientId}`) // Página do cliente atual
  revalidatePath("/dashboard/clients") // Lista de clientes
  // Revalida a página do assessor/videomaker ATUAL se o ID foi definido/alterado
  if (assigned_assessor_id) revalidatePath(`/dashboard/team/${assigned_assessor_id}`)
  if (assigned_videomaker_id) revalidatePath(`/dashboard/team/${assigned_videomaker_id}`)
  if (assigned_relationship_manager_id) revalidatePath(`/dashboard/team/${assigned_relationship_manager_id}`)
  // Revalida a página do assessor/videomaker ANTERIOR se ele foi removido ou alterado
  if (previousAssessorId && previousAssessorId !== assigned_assessor_id)
    revalidatePath(`/dashboard/team/${previousAssessorId}`)
  if (previousVideomakerId && previousVideomakerId !== assigned_videomaker_id)
    revalidatePath(`/dashboard/team/${previousVideomakerId}`)
  if (previousManagerId && previousManagerId !== assigned_relationship_manager_id)
    revalidatePath(`/dashboard/team/${previousManagerId}`)

  return { success: "Cliente atualizado com sucesso!" }
}
// --- FIM DA VERIFICAÇÃO ---

// --- Action para Atualizar Notas e Objetivos do Cliente ---
const updateClientNotesSchema = z.object({
  clientId: z.string().uuid(),
  client_notes: z.string().optional().or(z.literal("")), // Permite string vazia
  objectives: z.string().optional().or(z.literal("")), // Permite string vazia
})

export async function updateClientNotes(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validatedFields = updateClientNotesSchema.safeParse(rawData)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos para atualizar as notas." }
  }
  const { clientId, client_notes, objectives } = validatedFields.data
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin
    .from("clients")
    // Salva null se a string for vazia, senão salva a string
    .update({ client_notes: client_notes || null, objectives: objectives || null })
    .eq("id", clientId)
  if (error) {
    console.error("Erro Supabase (updateClientNotes):", error)
    return { error: `Erro ao salvar notas: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Notas e objetivos atualizados!" }
}

// --- Action para Adicionar Contrato ---
const addContractSchema = z.object({
  clientId: z.string().uuid(),
  contract_name: z.string().min(3, "O nome do contrato é obrigatório."),
  valor_mensal: z.coerce.number().min(0, "O valor mensal não pode ser negativo.").optional(),
  start_date: z.string().min(1, "A data de início é obrigatória."),
  end_date: z.string().optional().or(z.literal("")),
  contract_file: z.instanceof(File).optional(),
  services: z.string().optional(), // JSON string de serviços
})

export async function addContract(formData: FormData) {
  const rawFormData = {
    clientId: formData.get("clientId"),
    contract_name: formData.get("contract_name"),
    valor_mensal: formData.get("valor_mensal"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    contract_file: formData.get("contract_file"),
    services: formData.get("services"),
  }

  const validatedFields = addContractSchema.safeParse(rawFormData)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }
  const { clientId, contract_name, valor_mensal, start_date, end_date, contract_file, services } = validatedFields.data

  const servicesArray = services ? JSON.parse(services) : []

  // 1. Upload do arquivo (se existir)
  let contractPath = null
  if (contract_file && contract_file.size > 0) {
    const supabase = await createClient()
    const fileExtension = contract_file.name.split(".").pop()
    const newFileName = `${Date.now()}.${fileExtension}`
    const filePath = `${clientId}/${newFileName}`

    const { error: uploadError } = await supabase.storage.from("contracts").upload(filePath, contract_file)

    if (uploadError) {
      console.error("Erro Upload Contrato:", uploadError)
      return { error: `Não foi possível enviar o arquivo: ${uploadError.message}` }
    }
    contractPath = filePath
  }

  // 2. Insere dados na tabela 'contracts'
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let insertedContract
  let insertError

  // Primeiro tenta com services
  const insertData: any = {
    client_id: clientId,
    name: contract_name,
    valor_mensal: valor_mensal || 0,
    storage_path: contractPath,
    start_date: start_date,
    end_date: end_date || null,
    status: "active",
  }

  // Tenta incluir services se foi fornecido
  if (servicesArray.length > 0) {
    insertData.services = servicesArray
  }

  const result = await supabaseAdmin.from("contracts").insert(insertData).select().single()

  insertedContract = result.data
  insertError = result.error

  // Se falhou por causa da coluna services não existir, tenta sem ela
  if (insertError && insertError.message?.includes("services")) {
    delete insertData.services
    const retryResult = await supabaseAdmin.from("contracts").insert(insertData).select().single()
    insertedContract = retryResult.data
    insertError = retryResult.error
  }

  if (insertError || !insertedContract) {
    console.error("Erro Insert Contrato DB:", insertError)
    if (contractPath) {
      await createClient().then((s) => s.storage.from("contracts").remove([contractPath!]))
    }
    return { error: `Ocorreu um erro ao salvar o contrato: ${insertError?.message}` }
  }

  const nonRecurringServices = servicesArray.filter((service: string) => isNonRecurringService(service))

  if (nonRecurringServices.length > 0) {
    const deliverables = nonRecurringServices.map((service: string) => ({
      contract_id: insertedContract.id,
      service_name: service,
      delivered: false,
    }))

    try {
      await supabaseAdmin.from("contract_deliverables").insert(deliverables)
    } catch (error) {
      console.error("Erro ao criar deliverables (tabela pode não existir ainda):", error)
      // Não retorna erro, apenas loga - o contrato já foi criado
    }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath("/dashboard/clients")
  return { success: "Contrato adicionado com sucesso!" }
}

const updateDeliverableSchema = z.object({
  deliverableId: z.string().uuid(),
  clientId: z.string().uuid(),
  delivered: z.boolean(),
})

export async function updateDeliverable(data: { deliverableId: string; clientId: string; delivered: boolean }) {
  const validatedFields = updateDeliverableSchema.safeParse(data)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }

  const { deliverableId, clientId, delivered } = validatedFields.data
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const updateData: any = {
    delivered,
    delivery_date: delivered ? new Date().toISOString().split("T")[0] : null,
  }

  const { error } = await supabaseAdmin.from("contract_deliverables").update(updateData).eq("id", deliverableId)

  if (error) {
    console.error("Erro ao atualizar deliverable:", error)
    return { error: `Não foi possível atualizar: ${error.message}` }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Status de entrega atualizado!" }
}

// --- Action para Atualizar Status do Serviço Pontual ---
const updateServiceStatusSchema = z.object({
  serviceId: z.string().uuid(),
  clientId: z.string().uuid(),
  status: z.enum(["pending", "completed", "cancelled"]),
})

export async function updateServiceStatus(data: {
  serviceId: string
  clientId: string
  status: "pending" | "completed" | "cancelled"
}) {
  const validatedFields = updateServiceStatusSchema.safeParse(data)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos para atualizar o status." }
  }
  const { serviceId, clientId, status } = validatedFields.data
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin
    .from("one_time_services")
    .update({ status: status }) // Atualiza apenas o status
    .eq("id", serviceId)
  if (error) {
    console.error("Erro Supabase (updateServiceStatus):", error)
    return { error: `Não foi possível atualizar o status: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath("/dashboard/clients") // Revalida lista se o status afetar algum cálculo geral
  return { success: "Status do serviço atualizado com sucesso!" }
}

// --- Action para Atualizar Contrato ---
const updateContractSchema = z.object({
  contractId: z.string().uuid(),
  name: z.string().min(3, "O nome do contrato é obrigatório."),
  valor_mensal: z.coerce.number().min(0).optional(), // Valor opcional
  start_date: z.string().min(1, "A data de início é obrigatória."),
  end_date: z.string().optional().or(z.literal("")), // Fim opcional
  status: z.enum(["active", "inactive"]), // Status obrigatório
})

export async function updateContract(formData: FormData) {
  const rawData = Object.fromEntries(formData)
  const validatedFields = updateContractSchema.safeParse(rawData)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }
  const { contractId, name, valor_mensal, start_date, end_date, status } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // 1. Busca o client_id associado ao contrato (necessário para revalidar a página do cliente)
  const { data: contract, error: fetchError } = await supabaseAdmin
    .from("contracts")
    .select("client_id")
    .eq("id", contractId)
    .single() // Espera encontrar exatamente um

  if (fetchError || !contract) {
    console.error("Erro ao buscar contrato para atualização:", fetchError)
    return { error: "Contrato não encontrado ou erro ao buscar." }
  }

  // 2. Atualiza o contrato
  const { error: updateError } = await supabaseAdmin
    .from("contracts")
    .update({
      name,
      valor_mensal: valor_mensal || 0, // Usa 0 se não fornecido
      start_date, // Garanta YYYY-MM-DD
      end_date: end_date || null, // Salva null se vazio
      status,
    })
    .eq("id", contractId)

  if (updateError) {
    console.error("Erro Supabase (updateContract):", updateError)
    return { error: `Não foi possível atualizar o contrato: ${updateError.message}` }
  }

  revalidatePath(`/dashboard/clients/${contract.client_id}`) // Revalida a página do cliente
  revalidatePath("/dashboard/clients") // Revalida a lista
  return { success: "Contrato atualizado com sucesso!" }
}

// --- ACTIONS PARA GERENCIAR CONTATOS DO CLIENTE ---
const contactSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório."),
  role: z.string().optional().nullable(), // Cargo opcional
  email: z.string().email("Email inválido.").optional().or(z.literal("")), // Email opcional e pode ser vazio
  phone: z.string().optional().nullable(), // Telefone opcional
  birth_date: z.string().optional().or(z.literal("")).nullable(), // Data opcional (validar formato se necessário)
})

// Adicionar contato
export async function addClientContact(formData: FormData) {
  const clientId = formData.get("clientId") as string
  // Remove clientId antes de validar o restante com o schema
  formData.delete("clientId")
  const validatedFields = contactSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success || !clientId) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }
  const { name, role, email, phone, birth_date } = validatedFields.data
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin.from("client_contacts").insert({
    client_id: clientId,
    name,
    role: role || null, // Salva null se vazio
    email: email || null,
    phone: phone || null,
    birth_date: birth_date || null, // Salva null se vazio (garanta formato YYYY-MM-DD se fornecido)
  })
  if (error) {
    console.error("Erro Supabase (addClientContact):", error)
    return { error: `Erro ao salvar contato: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Contato adicionado com sucesso." }
}

// Atualizar contato
export async function updateClientContact(formData: FormData) {
  const contactId = formData.get("contactId") as string
  const clientId = formData.get("clientId") as string
  // Remove IDs antes de validar o restante
  formData.delete("contactId")
  formData.delete("clientId")
  const validatedFields = contactSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success || !contactId || !clientId) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }
  const { name, role, email, phone, birth_date } = validatedFields.data
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin
    .from("client_contacts")
    .update({
      name,
      role: role || null,
      email: email || null,
      phone: phone || null,
      birth_date: birth_date || null, // Garanta formato YYYY-MM-DD se fornecido
    })
    .eq("id", contactId) // Filtra pelo ID do contato
  if (error) {
    console.error("Erro Supabase (updateClientContact):", error)
    return { error: `Erro ao atualizar contato: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Contato atualizado com sucesso." }
}

// Deletar contato
export async function deleteClientContact(formData: FormData) {
  const contactId = formData.get("contactId") as string
  const clientId = formData.get("clientId") as string
  // Validação simples dos IDs (verifica se são UUIDs válidos)
  if (
    !contactId ||
    !clientId ||
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(contactId) ||
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(clientId)
  ) {
    return { error: "IDs inválidos." }
  }
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin.from("client_contacts").delete().eq("id", contactId) // Deleta pelo ID do contato
  if (error) {
    console.error("Erro Supabase (deleteClientContact):", error)
    return { error: `Erro ao deletar contato: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Contato removido com sucesso." }
}

// --- Action para Alternar Entrega de Serviço ---
const toggleServiceDeliverySchema = z.object({
  contractId: z.string().uuid(),
  clientId: z.string().uuid(),
  serviceName: z.string().min(1),
  currentStatus: z.boolean(),
})

export async function toggleServiceDelivery(data: {
  contractId: string
  clientId: string
  serviceName: string
  currentStatus: boolean
}) {
  const validatedFields = toggleServiceDeliverySchema.safeParse(data)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }

  const { contractId, clientId, serviceName, currentStatus } = validatedFields.data
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Verifica se já existe um deliverable para este serviço
  const { data: existingDeliverable } = await supabaseAdmin
    .from("contract_deliverables")
    .select("id")
    .eq("contract_id", contractId)
    .eq("service_name", serviceName)
    .maybeSingle()

  if (existingDeliverable) {
    // Atualiza o status existente
    const newStatus = !currentStatus
    const { error } = await supabaseAdmin
      .from("contract_deliverables")
      .update({
        delivered: newStatus,
        delivery_date: newStatus ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("id", existingDeliverable.id)

    if (error) {
      console.error("Erro ao atualizar deliverable:", error)
      return { error: `Não foi possível atualizar: ${error.message}` }
    }
  } else {
    // Cria um novo deliverable
    const { error } = await supabaseAdmin.from("contract_deliverables").insert({
      contract_id: contractId,
      service_name: serviceName,
      delivered: true,
      delivery_date: new Date().toISOString().split("T")[0],
    })

    if (error) {
      console.error("Erro ao criar deliverable:", error)
      return { error: `Não foi possível criar: ${error.message}` }
    }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: currentStatus ? "Marcado como não entregue" : "Marcado como entregue!" }
}
