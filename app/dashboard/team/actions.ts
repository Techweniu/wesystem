"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
// --- ALTERAÇÃO: Importar as constantes ---
import { ROLES, DEPARTMENTS } from "@/lib/constants"
// ----------------------------------------

// Schema completo para validação dos dados do colaborador
const employeeSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")), // Para edição ou criação
  name: z.string().min(3, "O nome é obrigatório."),
  email: z.string().email("O e-mail é inválido."),
  
  // --- ALTERAÇÃO: Valida o cargo contra a constante ROLES ---
  role: z.enum(ROLES, {
    errorMap: () => ({ message: "Selecione um cargo válido da lista." }),
  }),
  // ----------------------------------------------------------

  // --- ALTERAÇÃO: Valida o departamento contra a constante DEPARTMENTS ---
  department: z
    .enum(DEPARTMENTS, {
      errorMap: () => ({ message: "Selecione um departamento válido da lista." }),
    })
    .optional()
    .nullable(), // .optional().nullable() permite que seja ausente ou null
  // ---------------------------------------------------------------------

  salary: z.coerce.number().min(0, "O salário não pode ser negativo.").optional().nullable(),
  hire_date: z.string().min(1, "A data de contratação é obrigatória."), 
  status: z.enum(["active", "inactive"]),
  manager_id: z.string().uuid().optional().or(z.literal("null")).nullable(), 
  payment_day: z.coerce.number().min(1).max(31).optional().nullable(), 
})

// Ação para salvar (criar ou atualizar) um colaborador
export async function saveEmployee(formData: FormData) {
  const rawData = Object.fromEntries(formData)

  // Trata explicitamente o valor 'null' (string) vindo do select de gestor
  if (rawData.manager_id === "null") {
    rawData.manager_id = null
  }
  // Trata explicitamente o valor 'none' (string) ou ausência vindo do select de departamento
  if (!rawData.department || rawData.department === "none") {
    rawData.department = null
  }

  const validatedFields = employeeSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Erro Validação Colaborador:", validatedFields.error.flatten().fieldErrors)
    // Prioriza mensagens de erro específicas para role e department se existirem
    const roleError = validatedFields.error.flatten().fieldErrors.role?.[0]
    const deptError = validatedFields.error.flatten().fieldErrors.department?.[0]
    const firstOtherError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0] 
    return { error: roleError || deptError || firstOtherError || "Dados inválidos. Verifique os campos preenchidos." }
  }

  // Separa o ID dos outros dados validados
  const { id, ...employeeData } = validatedFields.data

  // Prepara os dados para salvar
  const dataToSave = {
    ...employeeData,
    hire_date: employeeData.hire_date ? new Date(employeeData.hire_date).toISOString().split("T")[0] : null,
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let error
  const isEditing = !!id 

  if (isEditing) {
    // Atualiza o colaborador existente
    const { error: updateError } = await supabaseAdmin.from("employees").update(dataToSave).eq("id", id)
    error = updateError
  } else {
    // Cria um novo colaborador
    const { error: insertError } = await supabaseAdmin.from("employees").insert(dataToSave)
    error = insertError
  }

  if (error) {
    console.error("Erro do Supabase (Colaborador):", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  // Revalida (atualiza o cache) das páginas relevantes
  revalidatePath("/dashboard/team")
  revalidatePath("/dashboard/org-chart")
  if (isEditing) {
    revalidatePath(`/dashboard/team/${id}`) 
  }

  return { success: `Colaborador ${isEditing ? "atualizado" : "criado"} com sucesso!` }
}

// --- AÇÃO PARA ADICIONAR OBSERVAÇÃO ---
const observationSchema = z.object({
  employeeId: z.string().uuid(),
  observation: z.string().min(1, "A observação não pode estar vazia."),
  tag: z.enum(["positive", "negative"]),
})

export async function addEmployeeObservation(formData: FormData) {
  const validatedFields = observationSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para salvar a observação." }
  }

  const { employeeId, observation, tag } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { error } = await supabaseAdmin.from("employee_observations").insert({
    employee_id: employeeId,
    observation: observation,
    tag: tag,
  })

  if (error) {
    console.error("Erro Supabase (Observação):", error)
    return { error: `Erro ao salvar observação: ${error.message}` }
  }

  revalidatePath(`/dashboard/team/${employeeId}`)
  return { success: "Observação salva com sucesso!" }
}

// --- AÇÃO PARA ADICIONAR CONTRATO DO COLABORADOR ---
const addContractSchema = z.object({
  employeeId: z.string().uuid("ID do colaborador inválido."),
  contract_name: z.string().min(3, "O nome do contrato é obrigatório."),
  contract_file: z.instanceof(File).refine((file) => file.size > 0, "O arquivo do contrato é obrigatório."),
})

export async function addEmployeeContract(formData: FormData) {
  const rawFormData = {
    employeeId: formData.get("employeeId"),
    contract_name: formData.get("contract_name"),
    contract_file: formData.get("contract_file"),
  }

  const validatedFields = addContractSchema.safeParse(rawFormData)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos." }
  }

  const { employeeId, contract_name, contract_file } = validatedFields.data

  let contractPath = null
  const supabase = await createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const fileExtension = contract_file.name.split(".").pop()
  const newFileName = `${Date.now()}.${fileExtension}` 
  const filePath = `${employeeId}/${newFileName}` 

  const { error: uploadError } = await supabase.storage
    .from("employee_contracts") 
    .upload(filePath, contract_file)

  if (uploadError) {
    console.error("Erro Upload Contrato:", uploadError)
    return { error: `Não foi possível enviar o arquivo: ${uploadError.message}` }
  }
  contractPath = filePath 

  const { error: insertError } = await supabase.from("employee_contracts").insert({
    employee_id: employeeId,
    name: contract_name,
    storage_path: contractPath, 
  })

  if (insertError) {
    console.error("Erro Insert Contrato DB:", insertError)
    await supabase.storage.from("employee_contracts").remove([contractPath])
    return { error: `Ocorreu um erro ao salvar o contrato: ${insertError.message}` }
  }

  revalidatePath(`/dashboard/team/${employeeId}`)
  return { success: "Contrato adicionado com sucesso!" }
}

// --- AÇÃO PARA ADICIONAR CONTRIBUIÇÃO DO COLABORADOR ---
const contributionSchema = z.object({
  employeeId: z.string().uuid(),
  description: z.string().min(3, "A descrição é obrigatória."),
  category: z.enum(["Venda", "Upsell", "Ideia", "Melhoria de Processo", "Outro"]), 
  value: z.coerce.number().min(0, "O valor não pode ser negativo.").optional().nullable(),
  date: z.string().min(1, "A data é obrigatória."), 
})

export async function addEmployeeContribution(formData: FormData) {
  const rawData = Object.fromEntries(formData)
  const validatedFields = contributionSchema.safeParse(rawData)

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos." }
  }

  const { employeeId, ...contributionData } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { error } = await supabaseAdmin.from("employee_contributions").insert({
    employee_id: employeeId,
    description: contributionData.description,
    category: contributionData.category,
    value: contributionData.value, 
    date: contributionData.date ? new Date(contributionData.date).toISOString().split("T")[0] : null,
  })

  if (error) {
    console.error("Erro Supabase (Contribuição):", error)
    return { error: `Erro ao salvar contribuição: ${error.message}` }
  }

  revalidatePath(`/dashboard/team/${employeeId}`)
  return { success: "Contribuição registrada com sucesso!" }
}

// --- AÇÃO PARA ADICIONAR PLANO DE CARREIRA ---
const addCareerPlanSchema = z.object({
  employeeId: z.string().uuid("ID do colaborador inválido."),
  career_plan_file: z.instanceof(File).refine((file) => file.size > 0, "O arquivo do plano de carreira é obrigatório."),
  expiration_date: z.string().min(1, "A data de expiração é obrigatória."),
})

export async function addCareerPlan(formData: FormData) {
  const rawFormData = {
    employeeId: formData.get("employeeId"),
    career_plan_file: formData.get("career_plan_file"),
    expiration_date: formData.get("expiration_date"),
  }

  const validatedFields = addCareerPlanSchema.safeParse(rawFormData)
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos." }
  }

  const { employeeId, career_plan_file, expiration_date } = validatedFields.data

  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const fileExtension = career_plan_file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `career-plans/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("financial-proofs")
      .upload(filePath, career_plan_file, {
        contentType: career_plan_file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError)
      return { error: "Erro ao fazer upload do plano de carreira." }
    }

    const { data: urlData } = supabaseAdmin.storage.from("financial-proofs").getPublicUrl(filePath)

    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({
        career_plan_url: urlData.publicUrl,
        career_plan_expiration_date: expiration_date,
      })
      .eq("id", employeeId)

    if (updateError) {
      console.error("Erro ao atualizar colaborador:", updateError)
      return { error: `Erro ao salvar plano de carreira: ${updateError.message}` }
    }

    revalidatePath("/dashboard/team")
    revalidatePath(`/dashboard/team/${employeeId}`)
    return { success: "Plano de carreira adicionado com sucesso!" }
  } catch (error) {
    console.error("Erro ao processar plano de carreira:", error)
    return { error: "Erro ao processar plano de carreira." }
  }
}
