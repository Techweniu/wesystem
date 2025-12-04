"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const accessSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  platform_name: z.string().min(1, "O nome da plataforma é obrigatório."),
  username: z.string().optional().nullable(),
  password_info: z.string().optional().nullable(),
  department: z.enum(["Diretoria", "Tecnologia", "Produção", "Marketing", "Cliente", "Geral"]).optional(),
  client_name: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function saveAccess(formData: FormData) {
  const rawData = Object.fromEntries(formData)

  if (rawData.client_id && rawData.client_id !== "null") {
    rawData.department = "Cliente"
  } else if (!rawData.department || rawData.department === "") {
    rawData.department = "Geral"
  }

  const validatedFields = accessSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors)
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos. Verifique os campos." }
  }

  const { id, ...accessData } = validatedFields.data

  const dataToSave = {
    ...accessData,
    department: accessData.department === "Geral" ? null : accessData.department,
    client_name: accessData.department === "Cliente" ? accessData.client_name : null,
    client_id: accessData.department === "Cliente" ? accessData.client_id : null,
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  let error
  let successMessage = ""

  if (id) {
    const { error: updateError } = await supabaseAdmin.from("platform_access").update(dataToSave).eq("id", id)
    error = updateError
    successMessage = "Acesso atualizado com sucesso!"
  } else {
    const { error: insertError } = await supabaseAdmin.from("platform_access").insert(dataToSave)
    error = insertError
    successMessage = "Acesso adicionado com sucesso!"
  }

  if (error) {
    console.error("Erro do Supabase:", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  revalidatePath("/dashboard/accesses")
  if (dataToSave.client_id) {
    revalidatePath(`/dashboard/clients/${dataToSave.client_id}`)
  }

  return { success: successMessage }
}

const deleteAccessSchema = z.object({
  accessId: z.string().uuid("ID inválido."),
})

export async function deleteAccess(formData: FormData) {
  const rawData = { accessId: formData.get("accessId") }
  const validatedFields = deleteAccessSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "ID inválido para exclusão." }
  }
  const { accessId } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: accessToDelete } = await supabaseAdmin
    .from("platform_access")
    .select("client_id")
    .eq("id", accessId)
    .single()

  const { error } = await supabaseAdmin.from("platform_access").delete().eq("id", accessId)

  if (error) {
    console.error("Erro Supabase ao deletar:", error)
    return { error: `Não foi possível excluir o acesso: ${error.message}` }
  }

  revalidatePath("/dashboard/accesses")
  if (accessToDelete?.client_id) {
    revalidatePath(`/dashboard/clients/${accessToDelete.client_id}`)
  }

  return { success: "Acesso excluído com sucesso!" }
}
