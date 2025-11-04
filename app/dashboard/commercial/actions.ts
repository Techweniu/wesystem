"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addCommercialGoal(formData: FormData) {
  const supabase = await createClient()

  const periodType = formData.get("period_type") as string
  const periodStart = formData.get("period_start") as string
  const periodEnd = formData.get("period_end") as string
  const targetValue = Number.parseFloat(formData.get("target_value") as string)
  const description = formData.get("description") as string

  const { error } = await supabase.from("commercial_goals").insert({
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    target_value: targetValue,
    description: description || null,
  })

  if (error) {
    console.error("Erro ao adicionar meta:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/commercial")
  return { success: true }
}

export async function deleteCommercialGoal(goalId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("commercial_goals").delete().eq("id", goalId)

  if (error) {
    console.error("Erro ao deletar meta:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/commercial")
  return { success: true }
}

export async function addClientUpsell(formData: FormData) {
  const supabase = await createClient()

  const clientId = formData.get("client_id") as string
  const status = formData.get("status") as string
  const identifiedDate = formData.get("identified_date") as string
  const notes = formData.get("notes") as string
  const servicesJson = formData.get("services") as string

  const services = servicesJson ? JSON.parse(servicesJson) : []

  const dataToInsert = {
    client_id: clientId,
    status: status || "identified",
    identified_date: identifiedDate,
    notes: notes || null,
    services,
    description: notes || "", // Temporary: backward compatibility until migration runs
    estimated_value: 0, // Temporary: backward compatibility until migration runs
    next_action: null, // Temporary: backward compatibility until migration runs
  }

  const { data, error } = await supabase.from("client_upsells").insert(dataToInsert).select()

  if (error) {
    console.error("Erro ao adicionar upsell:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/commercial")
  revalidatePath("/dashboard/clients")
  return { success: true }
}

export async function updateUpsellStatus(upsellId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("client_upsells")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", upsellId)

  if (error) {
    console.error("Erro ao atualizar status do upsell:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/commercial")
  return { success: true }
}

export async function deleteClientUpsell(upsellId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("client_upsells").delete().eq("id", upsellId)

  if (error) {
    console.error("Erro ao deletar upsell:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/commercial")
  return { success: true }
}
