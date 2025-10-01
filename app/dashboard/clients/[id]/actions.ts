"use server"

// A MUDANÇA CRUCIAL ESTÁ AQUI: Importamos de '@supabase/supabase-js'
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// O esquema de validação permanece o mesmo
const clientSchema = z.object({
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect"]),
})

const oneTimeServiceSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(3, "O nome do serviço é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.string().min(1, "A data é obrigatória."),
  status: z.enum(["pending", "completed", "cancelled"]),
})

export async function addClient(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())

  const validatedFields = clientSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors)
    return { error: "Dados inválidos." }
  }

  // Agora criamos o cliente admin dedicado, como planejado
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  const { data, error } = await supabaseAdmin.from("clients").insert([
    {
      name: validatedFields.data.name,
      contact_email: validatedFields.data.contact_email,
      contact_phone: validatedFields.data.contact_phone,
      status: validatedFields.data.status,
    },
  ])

  if (error) {
    console.error("Erro do Supabase ao adicionar cliente:", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  revalidatePath("/dashboard/clients")

  return { success: "Cliente adicionado com sucesso!" }
}

export async function addOneTimeService(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())

  const validatedFields = oneTimeServiceSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors)
    return { error: "Dados inválidos." }
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  const { error } = await supabaseAdmin.from("one_time_services").insert([
    {
      client_id: validatedFields.data.clientId,
      name: validatedFields.data.name,
      value: validatedFields.data.value,
      date: validatedFields.data.date,
      status: validatedFields.data.status,
    },
  ])

  if (error) {
    console.error("Erro do Supabase ao adicionar serviço:", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  revalidatePath(`/dashboard/clients/${validatedFields.data.clientId}`)

  return { success: "Serviço adicionado com sucesso!" }
}
