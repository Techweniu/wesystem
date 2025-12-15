"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { isNonRecurringService } from "@/lib/non-recurring-services"
import { cookies } from "next/headers"

// --- FUNÇÕES AUXILIARES DE SEGURANÇA E AUDITORIA ---
async function checkAdminPermission() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  if (role !== "admin") {
    throw new Error("Acesso negado: Apenas administradores podem realizar esta ação.")
  }
}

async function getApproverName() {
  const cookieStore = await cookies()
  return cookieStore.get("user_name")?.value || "Administrador"
}

// --- Action para Serviço Pontual ---
const oneTimeServiceSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  name: z.string().min(1, "O nome do serviço é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.string().min(1, "A data é obrigatória."),
  status: z.enum(["pending", "completed", "cancelled"], {
    errorMap: () => ({ message: "Status inválido." }),
  }),
})

export async function addOneTimeService(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())
  const validatedFields = oneTimeServiceSchema.safeParse(rawFormData)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }
  const { clientId, name, value, date, status } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin.from("one_time_services").insert([
    {
      client_id: clientId,
      name,
      value,
      date,
      status, // Status operacional (pendente/concluido)
      
      // Status de Aprovação (Novo Fluxo)
      approval_status: "pending",
      approved_by: null,
      approved_at: null
    },
  ])
  if (error) {
    console.error("Erro Supabase (addOneTimeService):", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath("/dashboard/clients")
  revalidatePath("/dashboard/financial")
  return { success: "Serviço adicionado e enviado para aprovação!" }
}

// --- NOVAS AÇÕES DE APROVAÇÃO (SERVIÇOS) ---
export async function approveService(id: string) {
  try {
    await checkAdminPermission()
    const approverName = await getApproverName()
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await supabaseAdmin
      .from("one_time_services")
      .update({
        approval_status: "approved",
        approved_by: approverName,
        approved_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) throw error
    revalidatePath("/dashboard/clients")
    return { success: true, message: "Serviço aprovado!" }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function rejectService(id: string) {
  try {
    await checkAdminPermission()
    const approverName = await getApproverName()
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await supabaseAdmin
      .from("one_time_services")
      .update({
        approval_status: "rejected",
        approved_by: approverName,
        approved_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) throw error
    revalidatePath("/dashboard/clients")
    return { success: true, message: "Serviço rejeitado." }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// --- Action para o NPS Interno ---

// Schema atualizado com chaves seguras (sem acentos/espaços)
const npsSchema = z.object({
  clientId: z.string().uuid(),
  conteudos_roteiros: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  audiovisual: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  edicao_videos: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  design: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  atendimento_assessor: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  atendimento_videomaker: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  comunicacao_presenca: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  resultado_parceria: z.coerce.number().min(0).max(10, "Nota deve ser entre 0 e 10"),
  observations: z.string().optional(),
})

// Mapeamento para converter de volta aos nomes legíveis antes de salvar no banco
const categoryLabelMap: Record<string, string> = {
  conteudos_roteiros: "Conteúdos e Roteiros",
  audiovisual: "Audiovisual",
  edicao_videos: "Edição de Vídeos",
  design: "Design",
  atendimento_assessor: "Atendimento Assessor",
  atendimento_videomaker: "Atendimento VideoMaker",
  comunicacao_presenca: "Comunicação e Presença",
  resultado_parceria: "Resultado da Parceria",
}

export async function addNpsResponse(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validatedFields = npsSchema.safeParse(rawData)
  
  if (!validatedFields.success) {
    console.error("Zod Validation Error:", validatedFields.error);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos. Verifique as notas." }
  }

  const { clientId, observations, ...slugScores } = validatedFields.data
  
  // Reconstrói o objeto category_scores com os nomes legíveis para o banco
  const categoryScores: Record<string, number> = {}
  let totalScore = 0
  let count = 0

  for (const [slug, score] of Object.entries(slugScores)) {
    const label = categoryLabelMap[slug] || slug
    categoryScores[label] = score
    totalScore += score
    count++
  }

  const averageScore = count > 0 ? totalScore / count : 0

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin.from("nps_responses").insert([
    {
      client_id: clientId,
      score: Math.round(averageScore),
      category_scores: categoryScores,
      observations: observations || null,
      response_date: new Date().toISOString().slice(0, 10),
    },
  ])
  if (error) {
    console.error("Erro Supabase (addNpsResponse):", error)
    return { error: `Ocorreu um erro ao salvar a avaliação: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Avaliação NPS salva com sucesso!" }
}


const updateClientSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  name: z.string().min(3, "O nome do cliente é obrigatório.").optional(),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "prospect"]).optional(),
  health_status: z.enum(["green", "yellow", "red"]).optional(),
  cnpj: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  credit_risk: z.string().optional().or(z.literal("")),
  has_traffic_service: z.preprocess((val) => val === "on", z.boolean()).optional(),
  ad_account_organized: z.preprocess((val) => val === "on", z.boolean()).optional(),
  ads_running: z.preprocess((val) => val === "on", z.boolean()).optional(),
  assigned_assessor_id: z.string().uuid("ID de assessor inválido.").or(z.literal("null")).optional().nullable(),
  assigned_videomaker_id: z.string().uuid("ID de videomaker inválido.").or(z.literal("null")).optional().nullable(),
  assigned_relationship_manager_id: z.string().uuid("ID de gestor inválido.").or(z.literal("null")).optional().nullable(),
  assigned_editor_id: z.string().uuid("ID de editor inválido.").or(z.literal("null")).optional().nullable(),
})

export async function updateClient(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())

  if (rawFormData.assigned_assessor_id === "null") rawFormData.assigned_assessor_id = null
  if (rawFormData.assigned_videomaker_id === "null") rawFormData.assigned_videomaker_id = null
  if (rawFormData.assigned_relationship_manager_id === "null") rawFormData.assigned_relationship_manager_id = null
  if (rawFormData.assigned_editor_id === "null") rawFormData.assigned_editor_id = null

  const validatedFields = updateClientSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }

  const {
    clientId,
    has_traffic_service,
    ad_account_organized,
    ads_running,
    assigned_assessor_id,
    assigned_videomaker_id,
    assigned_relationship_manager_id,
    assigned_editor_id,
    ...updateData
  } = validatedFields.data

  const dataToUpdate: Record<string, any> = {
    ...updateData,
    has_traffic_service: has_traffic_service ?? false,
    ad_account_organized: ad_account_organized ?? false,
    ads_running: ads_running ?? false,
    assigned_assessor_id: assigned_assessor_id,
    assigned_videomaker_id: assigned_videomaker_id,
    assigned_relationship_manager_id: assigned_relationship_manager_id,
    assigned_editor_id: assigned_editor_id,
    // REMOVIDO: updated_at: new Date().toISOString(), -- O Banco já tem trigger para isso e causava erro se a coluna estivesse desincronizada
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let previousAssessorId: string | null = null
  let previousVideomakerId: string | null = null
  let previousManagerId: string | null = null
  let previousEditorId: string | null = null
  const { data: previousClientData } = await supabaseAdmin
    .from("clients")
    .select("assigned_assessor_id, assigned_videomaker_id, assigned_relationship_manager_id, assigned_editor_id")
    .eq("id", clientId)
    .maybeSingle()

  if (previousClientData) {
    previousAssessorId = previousClientData.assigned_assessor_id
    previousVideomakerId = previousClientData.assigned_videomaker_id
    previousManagerId = previousClientData.assigned_relationship_manager_id
    previousEditorId = previousClientData.assigned_editor_id
  }

  const { error } = await supabaseAdmin
    .from("clients")
    .update(dataToUpdate)
    .eq("id", clientId)

  if (error) {
    console.error("Erro Supabase (updateClient):", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath("/dashboard/clients")
  if (assigned_assessor_id) revalidatePath(`/dashboard/team/${assigned_assessor_id}`)
  if (assigned_videomaker_id) revalidatePath(`/dashboard/team/${assigned_videomaker_id}`)
  if (assigned_relationship_manager_id) revalidatePath(`/dashboard/team/${assigned_relationship_manager_id}`)
  if (assigned_editor_id) revalidatePath(`/dashboard/team/${assigned_editor_id}`)
  
  if (previousAssessorId && previousAssessorId !== assigned_assessor_id)
    revalidatePath(`/dashboard/team/${previousAssessorId}`)
  if (previousVideomakerId && previousVideomakerId !== assigned_videomaker_id)
    revalidatePath(`/dashboard/team/${previousVideomakerId}`)
  if (previousManagerId && previousManagerId !== assigned_relationship_manager_id)
    revalidatePath(`/dashboard/team/${previousManagerId}`)
  if (previousEditorId && previousEditorId !== assigned_editor_id)
    revalidatePath(`/dashboard/team/${previousEditorId}`)

  return { success: "Cliente atualizado com sucesso!" }
}

const updateClientNotesSchema = z.object({
  clientId: z.string().uuid(),
  client_notes: z.string().optional().or(z.literal("")),
  objectives: z.string().optional().or(z.literal("")),
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
    .update({ client_notes: client_notes || null, objectives: objectives || null })
    .eq("id", clientId)
  if (error) {
    console.error("Erro Supabase (updateClientNotes):", error)
    return { error: `Erro ao salvar notas: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Notas e objetivos atualizados!" }
}

const addContractSchema = z.object({
  clientId: z.string().uuid(),
  contract_name: z.string().min(3, "O nome do contrato é obrigatório."),
  valor_mensal: z.coerce.number().min(0, "O valor mensal não pode ser negativo.").optional(),
  start_date: z.string().min(1, "A data de início é obrigatória."),
  end_date: z.string().optional().or(z.literal("")),
  contract_file: z.instanceof(File).optional(),
  services: z.string().optional(),
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

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let insertedContract
  let insertError

  const insertData: any = {
    client_id: clientId,
    name: contract_name,
    valor_mensal: valor_mensal || 0,
    storage_path: contractPath,
    start_date: start_date,
    end_date: end_date || null,
    status: "active",

    // Status de Aprovação (Novo Fluxo)
    approval_status: "pending",
    approved_by: null,
    approved_at: null
  }

  if (servicesArray.length > 0) {
    insertData.services = servicesArray
  }

  const result = await supabaseAdmin.from("contracts").insert(insertData).select().single()

  insertedContract = result.data
  insertError = result.error

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
    }
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath("/dashboard/clients")
  return { success: "Contrato enviado para aprovação!" }
}

// --- NOVAS AÇÕES DE APROVAÇÃO (CONTRATOS) ---
export async function approveContract(id: string) {
  try {
    await checkAdminPermission()
    const approverName = await getApproverName()
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await supabaseAdmin
      .from("contracts")
      .update({
        approval_status: "approved",
        approved_by: approverName,
        approved_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) throw error
    revalidatePath("/dashboard/clients")
    return { success: true, message: "Contrato aprovado!" }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function rejectContract(id: string) {
  try {
    await checkAdminPermission()
    const approverName = await getApproverName()
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await supabaseAdmin
      .from("contracts")
      .update({
        approval_status: "rejected",
        approved_by: approverName,
        approved_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) throw error
    revalidatePath("/dashboard/clients")
    return { success: true, message: "Contrato rejeitado." }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
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
    .update({ status: status })
    .eq("id", serviceId)
  if (error) {
    console.error("Erro Supabase (updateServiceStatus):", error)
    return { error: `Não foi possível atualizar o status: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath("/dashboard/clients")
  return { success: "Status do serviço atualizado com sucesso!" }
}

const updateContractSchema = z.object({
  contractId: z.string().uuid(),
  name: z.string().min(3, "O nome do contrato é obrigatório."),
  valor_mensal: z.coerce.number().min(0).optional(),
  start_date: z.string().min(1, "A data de início é obrigatória."),
  end_date: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
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

  const { data: contract, error: fetchError } = await supabaseAdmin
    .from("contracts")
    .select("client_id")
    .eq("id", contractId)
    .single()

  if (fetchError || !contract) {
    console.error("Erro ao buscar contrato para atualização:", fetchError)
    return { error: "Contrato não encontrado ou erro ao buscar." }
  }

  const { error: updateError } = await supabaseAdmin
    .from("contracts")
    .update({
      name,
      valor_mensal: valor_mensal || 0,
      start_date,
      end_date: end_date || null,
      status,
    })
    .eq("id", contractId)

  if (updateError) {
    console.error("Erro Supabase (updateContract):", updateError)
    return { error: `Não foi possível atualizar o contrato: ${updateError.message}` }
  }

  revalidatePath(`/dashboard/clients/${contract.client_id}`)
  revalidatePath("/dashboard/clients")
  return { success: "Contrato atualizado com sucesso!" }
}

const contactSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório."),
  role: z.string().optional().nullable(),
  email: z.string().email("Email inválido.").optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  birth_date: z.string().optional().or(z.literal("")).nullable(),
})

export async function addClientContact(formData: FormData) {
  const clientId = formData.get("clientId") as string
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
    role: role || null,
    email: email || null,
    phone: phone || null,
    birth_date: birth_date || null,
  })
  if (error) {
    console.error("Erro Supabase (addClientContact):", error)
    return { error: `Erro ao salvar contato: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Contato adicionado com sucesso." }
}

export async function updateClientContact(formData: FormData) {
  const contactId = formData.get("contactId") as string
  const clientId = formData.get("clientId") as string
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
      birth_date: birth_date || null,
    })
    .eq("id", contactId)
  if (error) {
    console.error("Erro Supabase (updateClientContact):", error)
    return { error: `Erro ao atualizar contato: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Contato atualizado com sucesso." }
}

export async function deleteClientContact(formData: FormData) {
  const contactId = formData.get("contactId") as string
  const clientId = formData.get("clientId") as string
  if (
    !contactId ||
    !clientId ||
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(contactId) ||
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(clientId)
  ) {
    return { error: "IDs inválidos." }
  }
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabaseAdmin.from("client_contacts").delete().eq("id", contactId)
  if (error) {
    console.error("Erro Supabase (deleteClientContact):", error)
    return { error: `Erro ao deletar contato: ${error.message}` }
  }
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Contato removido com sucesso." }
}

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

  const { data: existingDeliverable } = await supabaseAdmin
    .from("contract_deliverables")
    .select("id")
    .eq("contract_id", contractId)
    .eq("service_name", serviceName)
    .maybeSingle()

  if (existingDeliverable) {
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

}
