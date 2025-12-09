"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { cookies } from "next/headers" 

// --- FUNÇÃO AUXILIAR DE SEGURANÇA ---
async function checkAdminPermission() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  if (role !== "admin") {
    throw new Error("Acesso negado: Você não tem permissão para realizar operações comerciais.")
  }
}
// ------------------------------------

// Schemas Zod
const goalSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  type: z.enum(["revenue", "clients", "upsell_value", "churn_rate"]),
  target_value: z.coerce.number().min(0, "O valor da meta deve ser positivo."),
  current_value: z.coerce.number().min(0).default(0),
  deadline: z.string().min(1, "A data limite é obrigatória."),
})

const upsellSchema = z.object({
  client_id: z.string().uuid("ID do cliente inválido."),
  status: z.enum(["identified", "negotiating", "closed", "lost"]),
  services: z.array(z.string()).optional(),
  notes: z.string().optional(),
  identified_date: z.string().min(1, "Data é obrigatória."),
})

// --- ACTIONS DE METAS ---

export async function addCommercialGoal(formData: FormData) {
  try {
    await checkAdminPermission() // <--- PROTEÇÃO

    const rawData = {
      title: formData.get("title"),
      type: formData.get("type"),
      target_value: formData.get("target_value"),
      current_value: formData.get("current_value"),
      deadline: formData.get("deadline"),
    }

    const validatedFields = goalSchema.safeParse(rawData)

    if (!validatedFields.success) {
      return { success: false, error: "Dados inválidos. Verifique os campos." }
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin.from("commercial_goals").insert({
      ...validatedFields.data,
      created_at: new Date().toISOString(),
    })

    if (error) throw error

    revalidatePath("/dashboard/commercial")
    return { success: true, message: "Meta criada com sucesso!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function updateCommercialGoal(goalId: string, formData: FormData) {
  try {
    await checkAdminPermission() // <--- PROTEÇÃO

    const rawData = {
      title: formData.get("title"),
      type: formData.get("type"),
      target_value: formData.get("target_value"),
      current_value: formData.get("current_value"),
      deadline: formData.get("deadline"),
    }

    const validatedFields = goalSchema.safeParse(rawData)

    if (!validatedFields.success) return { success: false, error: "Dados inválidos." }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin.from("commercial_goals").update(validatedFields.data).eq("id", goalId)

    if (error) throw error

    revalidatePath("/dashboard/commercial")
    return { success: true, message: "Meta atualizada com sucesso!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function deleteCommercialGoal(goalId: string) {
  try {
    await checkAdminPermission() // <--- PROTEÇÃO

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { error } = await supabaseAdmin.from("commercial_goals").delete().eq("id", goalId)

    if (error) throw error

    revalidatePath("/dashboard/commercial")
    return { success: true, message: "Meta removida com sucesso!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// --- ACTIONS DE UPSELL (FUNIL) ---

export async function addClientUpsell(formData: FormData) {
  try {
    await checkAdminPermission() // <--- PROTEÇÃO

    // Processa os serviços (checkboxes múltiplos)
    const services = formData.getAll("service_ids[]") as string[]

    const rawData = {
      client_id: formData.get("client_id"),
      status: formData.get("status"),
      services: services,
      notes: formData.get("notes"),
      identified_date: formData.get("identified_date"),
    }

    const validatedFields = upsellSchema.safeParse(rawData)

    if (!validatedFields.success) {
      console.error(validatedFields.error)
      return { success: false, error: "Dados inválidos." }
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Busca nomes dos serviços para salvar no array de texto (simplificação)
    let serviceNames: string[] = []
    if (services.length > 0) {
      const { data: servicesData } = await supabaseAdmin.from("services").select("name").in("id", services)

      if (servicesData) {
        serviceNames = servicesData.map((s) => s.name)
      }
    }

    const { error } = await supabaseAdmin.from("client_upsells").insert({
      client_id: validatedFields.data.client_id,
      status: validatedFields.data.status,
      services: serviceNames, // Salva nomes
      notes: validatedFields.data.notes,
      identified_date: validatedFields.data.identified_date,
    })

    if (error) throw error

    revalidatePath("/dashboard/commercial")
    revalidatePath("/dashboard/clients")
    revalidatePath(`/dashboard/clients/${validatedFields.data.client_id}`)
    return { success: true, message: "Oportunidade adicionada!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function updateUpsellStatus(upsellId: string, newStatus: string) {
  try {
    await checkAdminPermission() // <--- PROTEÇÃO

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin.from("client_upsells").update({ status: newStatus }).eq("id", upsellId)

    if (error) throw error

    revalidatePath("/dashboard/commercial")
    revalidatePath("/dashboard/clients")
    return { success: true, message: "Status atualizado!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function deleteClientUpsell(upsellId: string) {
  try {
    await checkAdminPermission() // <--- PROTEÇÃO

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin.from("client_upsells").delete().eq("id", upsellId)

    if (error) throw error

    revalidatePath("/dashboard/commercial")
    revalidatePath("/dashboard/clients")
    return { success: true, message: "Oportunidade removida!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}
