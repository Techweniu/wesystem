"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ROLES, DEPARTMENTS, OFFICE_LOCATIONS } from "@/lib/constants"

// Schema completo para validação dos dados do colaborador
const employeeSchema = z
  .object({
    id: z.string().uuid().optional().or(z.literal("")),
    name: z.string().min(3, "O nome é obrigatório."),
    email: z.string().email("O e-mail é inválido."),

    role: z.enum(ROLES, {
      errorMap: () => ({ message: "Selecione um cargo válido da lista." }),
    }),

    department: z
      .enum(DEPARTMENTS, {
        errorMap: () => ({ message: "Selecione um departamento válido da lista." }),
      })
      .optional()
      .nullable(),

    salary: z.coerce.number().min(0, "O salário não pode ser negativo.").optional().nullable(),
    hire_date: z.string().min(1, "A data de contratação é obrigatória."),
    status: z.enum(["active", "inactive"]),
    manager_id: z.string().uuid().optional().or(z.literal("null")).nullable(),
    payment_day: z.coerce.number().min(1).max(31).optional().nullable(),

    // --- NOVOS CAMPOS ---
    work_model: z.enum(["presential", "home_office"], {
      errorMap: () => ({ message: "Selecione o modelo de trabalho." }),
    }),

    office_location: z.enum(OFFICE_LOCATIONS).optional().nullable(),
  })
  .refine(
    (data) => {
      // Validação condicional: Se for presencial, precisa de local
      if (data.work_model === "presential" && !data.office_location) {
        return false
      }
      return true
    },
    {
      message: "Selecione a unidade para o trabalho presencial.",
      path: ["office_location"],
    },
  )

// Ação para salvar (criar ou atualizar) um colaborador
export async function saveEmployee(formData: FormData) {
  const rawData = Object.fromEntries(formData)

  if (rawData.manager_id === "null") {
    rawData.manager_id = null
  }
  if (!rawData.department || rawData.department === "none") {
    rawData.department = null
  }

  // Tratamento para garantir que office_location seja null se não enviado
  if (!rawData.office_location || rawData.office_location === "null") {
    rawData.office_location = null
  }

  const validatedFields = employeeSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Erro Validação Colaborador:", validatedFields.error.flatten().fieldErrors)
    const roleError = validatedFields.error.flatten().fieldErrors.role?.[0]
    const deptError = validatedFields.error.flatten().fieldErrors.department?.[0]
    const locationError = validatedFields.error.flatten().fieldErrors.office_location?.[0] // Captura erro de local
    const firstOtherError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return {
      error:
        roleError ||
        deptError ||
        locationError ||
        firstOtherError ||
        "Dados inválidos. Verifique os campos preenchidos.",
    }
  }

  const { id, ...employeeData } = validatedFields.data

  // Lógica de Negócio: Se for Home Office, forçamos o local a ser NULL
  // Isso garante integridade mesmo se o front mandar lixo
  if (employeeData.work_model === "home_office") {
    employeeData.office_location = null
  }

  const dataToSave = {
    ...employeeData,
    hire_date: employeeData.hire_date ? new Date(employeeData.hire_date).toISOString().split("T")[0] : null,
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let error
  const isEditing = !!id

  if (isEditing) {
    const { error: updateError } = await supabaseAdmin.from("employees").update(dataToSave).eq("id", id)
    error = updateError
  } else {
    const { error: insertError } = await supabaseAdmin.from("employees").insert(dataToSave)
    error = insertError
  }

  if (error) {
    console.error("Erro do Supabase (Colaborador):", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

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
  tag: z
    .enum([
      "feedback_positivo",
      "feedback_negativo",
      "reuniao_1_1",
      "desenvolvimento",
      "performance",
      "comportamento",
      "geral",
      "positive", // Keep backward compatibility
      "negative", // Keep backward compatibility
    ])
    .optional()
    .default("geral"),
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
  revalidatePath("/dashboard/team")
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
  const supabase = await createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const fileExtension = contract_file.name.split(".").pop()
  const newFileName = `${Date.now()}.${fileExtension}`
  const filePath = `${employeeId}/${newFileName}`

  const { error: uploadError } = await supabase.storage.from("employee_contracts").upload(filePath, contract_file)

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

// --- AÇÃO PARA ADICIONAR ARQUIVO DE PLANO DE CARREIRA (LEGADO) ---
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

// --- NOVA AÇÃO: SALVAR PAINEL DO PLANO DE CARREIRA ---
const updateCareerPlanPanelSchema = z.object({
  employeeId: z.string().uuid(),
  content: z.string().optional().or(z.literal("")),
  goals: z.string(), // JSON String
  expirationDate: z.string().optional().or(z.literal("")),
})

export async function updateCareerPlanPanel(formData: FormData) {
  const rawData = Object.fromEntries(formData)
  const validatedFields = updateCareerPlanPanelSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Dados inválidos." }
  }

  const { employeeId, content, goals, expirationDate } = validatedFields.data
  
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Converte string vazia para null para data
  const dateToSave = expirationDate && expirationDate.length > 0 ? expirationDate : null;

  const { error } = await supabaseAdmin
    .from("employees")
    .update({
      career_plan_content: content || null,
      career_plan_goals: JSON.parse(goals),
      career_plan_expiration_date: dateToSave // Atualiza a data existente
    })
    .eq("id", employeeId)

  if (error) {
    console.error("Erro ao atualizar plano de carreira (painel):", error)
    return { error: "Erro ao salvar o plano de carreira." }
  }

  revalidatePath(`/dashboard/team/${employeeId}`)
  return { success: "Plano de carreira atualizado com sucesso!" }
}
