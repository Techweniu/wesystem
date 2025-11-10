"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Lista de cargos válidos (deve ser a mesma do formulário)
const validRoles = [
  "Diretor de Operações",
  "Diretor de Relacionamento com Cliente",
  "Diretor de Marketing",
  "Diretor de Tecnologia",
  "Diretor de Audiovisual",
  "Diretor Comercial",
  "Gestor de Relacionamento",
  "Videomaker",
  "Editor", // <-- ADICIONADO AQUI
  "Assessor",
  "Colaborador de Tecnologia",
  "Backoffice",
  "Representante Comercial",
] as const // 'as const' torna os valores literais para o z.enum

// Lista de departamentos válidos (deve ser a mesma do formulário)
const validDepartments = ["Diretoria", "Tecnologia", "Edição", "Assessoria", "Audiovisual"] as const // 'as const'

// Schema completo para validação dos dados do colaborador
const employeeSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")), // Para edição ou criação
  name: z.string().min(3, "O nome é obrigatório."),
  email: z.string().email("O e-mail é inválido."),
  // Valida o cargo contra a lista
  role: z.enum(validRoles, {
    errorMap: () => ({ message: "Selecione um cargo válido da lista." }),
  }),
  // Valida o departamento contra a lista (opcional e pode ser nulo)
  department: z
    .enum(validDepartments, {
      errorMap: () => ({ message: "Selecione um departamento válido da lista." }),
    })
    .optional()
    .nullable(), // .optional().nullable() permite que seja ausente ou null
  salary: z.coerce.number().min(0, "O salário não pode ser negativo.").optional().nullable(),
  hire_date: z.string().min(1, "A data de contratação é obrigatória."), // Validação de data mais robusta pode ser adicionada se necessário
  status: z.enum(["active", "inactive"]),
  manager_id: z.string().uuid().optional().or(z.literal("null")).nullable(), // Aceita UUID, 'null' string, ou null/undefined
  payment_day: z.coerce.number().min(1).max(31).optional().nullable(), // Converte para número, valida intervalo, opcional e nulo
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
    const firstOtherError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0] // Pega o primeiro erro de qualquer outro campo
    return { error: roleError || deptError || firstOtherError || "Dados inválidos. Verifique os campos preenchidos." }
  }

  // Separa o ID dos outros dados validados
  const { id, ...employeeData } = validatedFields.data

  // Prepara os dados para salvar (manager_id já está como null ou UUID)
  // Converte a data de contratação para o formato ISO YYYY-MM-DD
  const dataToSave = {
    ...employeeData,
    // department já está como null ou um valor válido do enum
    hire_date: employeeData.hire_date ? new Date(employeeData.hire_date).toISOString().split("T")[0] : null, // Garante formato YYYY-MM-DD
  }

  // Cria um cliente Supabase com permissões de administrador
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let error
  const isEditing = !!id // Verifica se é uma edição (se o ID existe)

  if (isEditing) {
    // Atualiza o colaborador existente
    const { error: updateError } = await supabaseAdmin.from("employees").update(dataToSave).eq("id", id)
    error = updateError
  } else {
    // Cria um novo colaborador
    const { error: insertError } = await supabaseAdmin.from("employees").insert(dataToSave)
    error = insertError
  }

  // Verifica se ocorreu erro no banco de dados
  if (error) {
    console.error("Erro do Supabase (Colaborador):", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  // Revalida (atualiza o cache) das páginas relevantes para mostrar os dados atualizados
  revalidatePath("/dashboard/team")
  revalidatePath("/dashboard/org-chart")
  if (isEditing) {
    revalidatePath(`/dashboard/team/${id}`) // Revalida a página de detalhes se estiver editando
  }

  return { success: `Colaborador ${isEditing ? "atualizado" : "criado"} com sucesso!` }
}

// --- AÇÕES DE PAGAMENTO REMOVIDAS DESTE ARQUIVO ---

// --- AÇÃO PARA ADICIONAR OBSERVAÇÃO ---
const observationSchema = z.object({
  employeeId: z.string().uuid(),
  observation: z.string().min(1, "A observação não pode estar vazia."),
  tag: z.enum(["positive", "negative"]), // Garante que a tag seja 'positive' ou 'negative'
})

export async function addEmployeeObservation(formData: FormData) {
  const validatedFields = observationSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para salvar a observação." }
  }

  const { employeeId, observation, tag } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Insere a nova observação
  const { error } = await supabaseAdmin.from("employee_observations").insert({
    employee_id: employeeId,
    observation: observation,
    tag: tag,
  })

  if (error) {
    console.error("Erro Supabase (Observação):", error)
    return { error: `Erro ao salvar observação: ${error.message}` }
  }

  // Revalida a página de detalhes do colaborador para mostrar a nova observação
  revalidatePath(`/dashboard/team/${employeeId}`)
  return { success: "Observação salva com sucesso!" }
}

// --- AÇÃO PARA ADICIONAR CONTRATO DO COLABORADOR ---
const addContractSchema = z.object({
  employeeId: z.string().uuid("ID do colaborador inválido."),
  contract_name: z.string().min(3, "O nome do contrato é obrigatório."),
  // Valida se o arquivo existe e tem tamanho maior que 0
  contract_file: z.instanceof(File).refine((file) => file.size > 0, "O arquivo do contrato é obrigatório."),
})

export async function addEmployeeContract(formData: FormData) {
  // Extrai os dados do FormData
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

  // 1. Faz upload do arquivo para o Supabase Storage
  let contractPath = null
  const supabase = await createClient() // Cliente normal para acesso ao Storage (RLS deve permitir)
  const fileExtension = contract_file.name.split(".").pop()
  const newFileName = `${Date.now()}.${fileExtension}` // Nome único para o arquivo
  const filePath = `${employeeId}/${newFileName}` // Organiza por ID do colaborador

  const { error: uploadError } = await supabase.storage
    .from("employee_contracts") // Nome do bucket de contratos de funcionários
    .upload(filePath, contract_file)

  if (uploadError) {
    console.error("Erro Upload Contrato:", uploadError)
    return { error: `Não foi possível enviar o arquivo: ${uploadError.message}` }
  }
  contractPath = filePath // Guarda o caminho do arquivo no bucket

  // 2. Insere os metadados na tabela 'employee_contracts'
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error: insertError } = await supabaseAdmin.from("employee_contracts").insert({
    employee_id: employeeId,
    name: contract_name,
    storage_path: contractPath, // Salva o caminho do arquivo no banco
  })

  if (insertError) {
    console.error("Erro Insert Contrato DB:", insertError)
    // Se falhar ao salvar no banco, remove o arquivo do Storage para evitar órfãos
    await supabase.storage.from("employee_contracts").remove([contractPath])
    return { error: `Ocorreu um erro ao salvar o contrato: ${insertError.message}` }
  }

  // Revalida a página de detalhes para mostrar o novo contrato
  revalidatePath(`/dashboard/team/${employeeId}`)
  return { success: "Contrato adicionado com sucesso!" }
}

// --- AÇÃO PARA ADICIONAR CONTRIBUIÇÃO DO COLABORADOR ---
const contributionSchema = z.object({
  employeeId: z.string().uuid(),
  description: z.string().min(3, "A descrição é obrigatória."),
  category: z.enum(["Venda", "Upsell", "Ideia", "Melhoria de Processo", "Outro"]), // Categorias válidas
  value: z.coerce.number().min(0, "O valor não pode ser negativo.").optional().nullable(), // Valor opcional/nulo
  date: z.string().min(1, "A data é obrigatória."), // Data obrigatória
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

  // Insere a contribuição no banco
  const { error } = await supabaseAdmin.from("employee_contributions").insert({
    employee_id: employeeId,
    description: contributionData.description,
    category: contributionData.category,
    value: contributionData.value, // Pode ser null
    // Garante formato YYYY-MM-DD para a data
    date: contributionData.date ? new Date(contributionData.date).toISOString().split("T")[0] : null,
  })

  if (error) {
    console.error("Erro Supabase (Contribuição):", error)
    return { error: `Erro ao salvar contribuição: ${error.message}` }
  }

  // Revalida a página de detalhes para mostrar a nova contribuição
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

    // Upload do arquivo para Supabase Storage
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

    // Atualiza o colaborador com a URL do plano e a data de expiração
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
