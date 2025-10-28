"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// =====> ADICIONADO: Lista de cargos válidos para validação <=====
const validRoles = [
  "Diretor de Operações",
  "Diretor de Relacionamento com Cliente",
  "Diretor de Marketing",
  "Diretor de Tecnologia",
  "Diretor de Audiovisual",
  "Diretor Comercial",
  "Gestor de Relacionamento", // Adicionado "Gestor de Relacionamento" aos cargos válidos
  "Videomaker",
  "Assessor",
  "Colaborador de Tecnologia",
  "Backoffice",
  "Representante Comercial",
] as const
// ============================================================

// Schema para adicionar colaborador via organograma
const addEmployeeSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório."),
  // ====> CAMPO ROLE ALTERADO PARA z.enum <====
  role: z.enum(validRoles, {
    errorMap: () => ({ message: "Selecione um cargo válido da lista." }),
  }),
  // ==========================================
  manager_id: z.string().uuid().optional().or(z.literal("null")).nullable(), // Permite 'null' como string
})

export async function addOrgPosition(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  // Trata explicitamente o 'null' string do select antes da validação
  if (rawData.manager_id === "null") {
    rawData.manager_id = null
  }
  const validatedFields = addEmployeeSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Erro Validação addOrgPosition:", validatedFields.error.flatten().fieldErrors)
    const roleError = validatedFields.error.flatten().fieldErrors.role?.[0]
    const firstOtherError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: roleError || firstOtherError || "Dados inválidos." }
  }

  // manager_id já está como null ou UUID aqui
  const { name, role, manager_id } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Geração de email temporário (sem alterações)
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  const tempEmail = `${name.toLowerCase().replace(/\s+/g, ".")}.${randomSuffix}@wesystem.io`

  const { error } = await supabaseAdmin.from("employees").insert({
    name,
    role,
    manager_id: manager_id, // Já está no formato correto (null ou UUID)
    email: tempEmail,
    hire_date: new Date().toISOString().split("T")[0],
    status: "active",
  })

  if (error) {
    console.error("Erro do Supabase ao criar colaborador (OrgChart):", error)
    if (error.code === "23505" && error.message.includes("employees_email_key")) {
      return { error: `Ocorreu um erro: O e-mail temporário '${tempEmail}' já existe. Tente adicionar novamente.` }
    }
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  revalidatePath("/dashboard/org-chart")
  revalidatePath("/dashboard/team")
  return { success: "Colaborador adicionado com sucesso!" }
}

// Schema para deletar (agora inativar) - Sem alterações na validação em si
const deleteEmployeeSchema = z.object({
  positionId: z.string().uuid("ID inválido"),
})

// Ação de deletar (agora inativar) - Sem alterações na lógica
export async function deleteOrgPosition(formData: FormData) {
  const rawData = { positionId: formData.get("positionId") }
  const validatedFields = deleteEmployeeSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "ID inválido." }
  }
  const { positionId } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { error } = await supabaseAdmin
    .from("employees")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", positionId)

  if (error) {
    console.error("Erro Supabase ao inativar (OrgChart):", error)
    return { error: `Não foi possível inativar o colaborador: ${error.message}` }
  }

  revalidatePath("/dashboard/org-chart")
  revalidatePath("/dashboard/team")
  return { success: "Colaborador inativado com sucesso!" }
}

// Schema para atualizar posição via organograma
const updateEmployeeSchema = z.object({
  positionId: z.string().uuid(),
  name: z.string().min(3, "O nome é obrigatório."),
  // ====> CAMPO ROLE ALTERADO PARA z.enum AQUI TAMBÉM <====
  role: z.enum(validRoles, {
    errorMap: () => ({ message: "Selecione um cargo válido da lista." }),
  }),
  // ======================================================
  manager_id: z.string().uuid().optional().or(z.literal("null")).nullable(), // Permite 'null' como string
})

// Ação de atualizar posição via organograma
export async function updateOrgPosition(formData: FormData) {
  const rawData = Object.fromEntries(formData)
  // Trata explicitamente o 'null' string do select antes da validação
  if (rawData.manager_id === "null") {
    rawData.manager_id = null
  }
  const validatedFields = updateEmployeeSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Erro Validação updateOrgPosition:", validatedFields.error.flatten().fieldErrors)
    const roleError = validatedFields.error.flatten().fieldErrors.role?.[0]
    const firstOtherError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: roleError || firstOtherError || "Dados inválidos." }
  }
  // manager_id já está como null ou UUID aqui
  const { positionId, name, role, manager_id } = validatedFields.data
  if (positionId === manager_id) {
    return { error: "Um colaborador não pode ser seu próprio gestor." }
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const dataToUpdate = {
    name,
    role,
    manager_id: manager_id, // Já está no formato correto (null ou UUID)
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin.from("employees").update(dataToUpdate).eq("id", positionId)

  if (error) {
    console.error("Erro Supabase ao atualizar (OrgChart):", error)
    return { error: `Não foi possível atualizar o colaborador: ${error.message}` }
  }

  revalidatePath("/dashboard/org-chart")
  revalidatePath("/dashboard/team")
  revalidatePath(`/dashboard/team/${positionId}`)
  return { success: "Colaborador atualizado com sucesso!" }
}
