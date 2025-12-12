"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { cookies } from "next/headers"
import { put } from "@vercel/blob"

// --- FUNÇÃO AUXILIAR DE SEGURANÇA ---
async function checkAdminPermission() {
  const cookieStore = await cookies()
  const role = cookieStore.get("user_role")?.value
  if (role !== "admin") {
    throw new Error("Acesso negado: Você não tem permissão para realizar esta operação financeira.")
  }
}
// ------------------------------------

const costSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.coerce.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  is_recurring: z.preprocess((val) => val === "true", z.boolean()).default(false),
  recurrence_days: z.coerce.number().min(1).max(365).default(30),
})

// --- AÇÃO addCost ---
export async function addCost(formData: FormData) {
  try {
    await checkAdminPermission()

    // Validate proof file
    const proofFile = formData.get("proof_file") as File
    if (!proofFile || proofFile.size === 0) {
      return { success: false, error: "Comprovante é obrigatório." }
    }

    const rawData = {
      description: formData.get("description"),
      value: formData.get("value"),
      category: formData.get("category"),
      date: formData.get("date"),
      is_recurring: formData.get("is_recurring"),
      recurrence_days: formData.get("recurrence_days"),
    }

    const validated = costSchema.safeParse(rawData)

    if (!validated.success) {
      const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0]
      return { success: false, error: firstError || "Dados inválidos." }
    }

    // Upload proof file to Vercel Blob
    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `costs/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

    const blob = await put(fileName, proofFile, {
      access: "public",
    })

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin.from("costs").insert([
      {
        description: validated.data.description,
        value: validated.data.value,
        category: validated.data.category,
        date: validated.data.date,
        is_recurring: validated.data.is_recurring,
        recurrence_days: validated.data.is_recurring ? validated.data.recurrence_days : null,
        status: "pending",
        paid_date: null,
        proof_url: blob.url,
        payment_proof_url: null,
      },
    ])

    if (error) throw error

    revalidatePath("/dashboard/financial")
    return { success: true, message: "Custo adicionado com sucesso!" }
  } catch (error) {
    console.error("Erro ao adicionar custo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// --- AÇÃO updateCost ---
export async function updateCost(id: string, formData: FormData) {
  try {
    await checkAdminPermission()

    const rawData = {
      description: formData.get("description"),
      value: formData.get("value"),
      category: formData.get("category"),
      date: formData.get("date"),
      is_recurring: formData.get("is_recurring"),
      recurrence_days: formData.get("recurrence_days"),
    }

    const validated = costSchema.safeParse(rawData)

    if (!validated.success) {
      const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0]
      return { success: false, error: firstError || "Dados inválidos." }
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin.from("costs").update(validated.data).eq("id", id)

    if (error) throw error

    revalidatePath("/dashboard/financial")
    return { success: true, message: "Custo atualizado com sucesso!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// --- AÇÃO deleteCost ---
export async function deleteCost(id: string) {
  try {
    await checkAdminPermission()

    if (!id) return { success: false, error: "ID inválido." }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin.from("costs").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/dashboard/financial")
    return { success: true, message: "Custo deletado com sucesso!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// --- AÇÃO markClientPaymentAsPaid ---
const clientPaymentSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
})

export async function markClientPaymentAsPaid(formData: FormData) {
  try {
    await checkAdminPermission()

    const proofFile = formData.get("proof_file") as File
    if (!proofFile || proofFile.size === 0) {
      return { error: "Comprovante é obrigatório." }
    }

    const validatedFields = clientPaymentSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) {
      return { error: "Dados inválidos." }
    }

    const { clientId, amount } = validatedFields.data
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `client-payments/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage.from("financial-proofs").upload(filePath, proofFile, {
      contentType: proofFile.type,
      upsert: false,
    })

    if (uploadError) return { error: "Erro no upload do comprovante." }

    const { data: urlData } = supabaseAdmin.storage.from("financial-proofs").getPublicUrl(filePath)

    const { error } = await supabaseAdmin.from("client_payments").insert({
      client_id: clientId,
      amount: amount,
      payment_date: new Date().toISOString(),
      proof_url: urlData.publicUrl,
    })

    if (error) return { error: error.message }

    revalidatePath("/dashboard/financial")
    revalidatePath(`/dashboard/clients/${clientId}`)
    return { success: "Pagamento registrado!" }
  } catch (e: any) {
    return { error: e.message }
  }
}

// --- AÇÃO undoClientPayment ---
const undoClientPaymentSchema = z.object({
  clientId: z.string().uuid(),
})

export async function undoClientPayment(formData: FormData) {
  try {
    await checkAdminPermission()

    const validatedFields = undoClientPaymentSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) return { error: "ID inválido." }

    const { clientId } = validatedFields.data
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: recentPayment } = await supabaseAdmin
      .from("client_payments")
      .select("id")
      .eq("client_id", clientId)
      .gte("payment_date", startOfMonth.toISOString())
      .order("payment_date", { ascending: false })
      .limit(1)
      .single()

    if (!recentPayment) return { error: "Nenhum pagamento encontrado neste mês." }

    const { error } = await supabaseAdmin.from("client_payments").delete().eq("id", recentPayment.id)
    if (error) return { error: error.message }

    revalidatePath("/dashboard/financial")
    revalidatePath(`/dashboard/clients/${clientId}`)
    return { success: "Pagamento revertido!" }
  } catch (e: any) {
    return { error: e.message }
  }
}

// --- AÇÃO markCostAsPaid ---
const costPaymentSchema = z.object({
  costId: z.string().uuid(),
  amount: z.coerce.number().positive(),
})

export async function markCostAsPaid(formData: FormData) {
  try {
    await checkAdminPermission()

    const validatedFields = costPaymentSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) return { error: "Dados inválidos." }

    const { costId } = validatedFields.data
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: cost } = await supabaseAdmin.from("costs").select("*").eq("id", costId).single()
    if (!cost) return { error: "Custo não encontrado." }

    const proofFile = formData.get("proof_file") as File
    if (!proofFile || proofFile.size === 0) return { error: "Comprovante obrigatório." }

    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `cost-payments/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

    const blob = await put(fileName, proofFile, {
      access: "public",
    })

    // 1. Atualiza o custo atual para PAGO
    const { error: paymentError } = await supabaseAdmin
      .from("costs")
      .update({
        paid_date: new Date().toISOString().split("T")[0],
        status: "paid",
        payment_proof_url: blob.url,
      })
      .eq("id", costId)

    if (paymentError) return { error: paymentError.message }

    // 2. Se for recorrente, cria o PRÓXIMO custo
    if (cost.is_recurring) {
      const recurrenceDays = cost.recurrence_days || 30 // fallback to 30 if not set
      const nextDate = new Date(cost.date)
      nextDate.setDate(nextDate.getDate() + recurrenceDays)

      // Cria a nova linha (histórico cumulativo).
      // IMPORTANTE: proof_url é setado como null, pois o comprovante do novo custo
      // (a fatura do próximo mês) ainda não existe.
      await supabaseAdmin.from("costs").insert({
        description: cost.description,
        value: cost.value,
        category: cost.category,
        date: nextDate.toISOString().split("T")[0],
        is_recurring: true,
        recurrence_days: recurrenceDays,
        paid_date: null,
        status: "pending",
        proof_url: null, // Novo custo começa sem comprovante (nota fiscal)
        payment_proof_url: null, // E sem comprovante de pagamento
      })
    }

    revalidatePath("/dashboard/financial")
    return { success: "Pagamento registrado!" }
  } catch (e: any) {
    return { error: e.message }
  }
}

// --- AÇÃO undoCostPayment ---
const undoCostPaymentSchema = z.object({
  costId: z.string().uuid(),
})

export async function undoCostPayment(formData: FormData) {
  try {
    await checkAdminPermission()

    const validatedFields = undoCostPaymentSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) return { error: "ID inválido." }

    const { costId } = validatedFields.data
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin
      .from("costs")
      .update({
        paid_date: null,
        status: "pending",
        payment_proof_url: null, // Only clear payment proof
      })
      .eq("id", costId)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/financial")
    return { success: "Pagamento revertido!" }
  } catch (e: any) {
    return { error: e.message }
  }
}

// --- AÇÃO markPaymentAsPaid (Funcionários) ---
const paymentSchema = z.object({
  employeeId: z.string().uuid(),
  amount: z.coerce.number().positive(),
})

export async function markPaymentAsPaid(formData: FormData) {
  try {
    await checkAdminPermission()

    const proofFile = formData.get("proof_file") as File
    if (!proofFile || proofFile.size === 0) return { error: "Comprovante obrigatório." }

    const validatedFields = paymentSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) return { error: "Dados inválidos." }

    const { employeeId, amount } = validatedFields.data
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `employee-payments/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage.from("financial-proofs").upload(filePath, proofFile, {
      contentType: proofFile.type,
      upsert: false,
    })
    if (uploadError) return { error: "Erro no upload." }

    const { data: urlData } = supabaseAdmin.storage.from("financial-proofs").getPublicUrl(filePath)

    const { error } = await supabaseAdmin.from("employee_payments").insert({
      employee_id: employeeId,
      amount: amount,
      payment_date: new Date().toISOString(),
      proof_url: urlData.publicUrl,
    })

    if (error) return { error: error.message }

    revalidatePath("/dashboard/financial")
    revalidatePath("/dashboard/team")
    return { success: "Pagamento registrado!" }
  } catch (e: any) {
    return { error: e.message }
  }
}

// --- AÇÃO undoEmployeePayment ---
const undoPaymentSchema = z.object({
  employeeId: z.string().uuid(),
})

export async function undoEmployeePayment(formData: FormData) {
  try {
    await checkAdminPermission()

    const validatedFields = undoPaymentSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) return { error: "ID inválido." }

    const { employeeId } = validatedFields.data
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: recentPayment } = await supabaseAdmin
      .from("employee_payments")
      .select("id")
      .eq("employee_id", employeeId)
      .gte("payment_date", startOfMonth.toISOString())
      .order("payment_date", { ascending: false })
      .limit(1)
      .single()

    if (!recentPayment) return { error: "Nenhum pagamento encontrado neste mês." }

    const { error } = await supabaseAdmin.from("employee_payments").delete().eq("id", recentPayment.id)
    if (error) return { error: error.message }

    revalidatePath("/dashboard/financial")
    revalidatePath("/dashboard/team")
    return { success: "Pagamento revertido!" }
  } catch (e: any) {
    return { error: e.message }
  }
}

// --- AÇÃO markServiceAsReceived ---
const servicePaymentSchema = z.object({
  serviceId: z.string().uuid(),
  clientId: z.string().uuid(),
  amount: z.coerce.number().positive(),
})

export async function markServiceAsReceived(formData: FormData) {
  try {
    await checkAdminPermission()

    const proofFile = formData.get("proof_file") as File
    if (!proofFile || proofFile.size === 0) return { error: "Comprovante obrigatório." }

    const validatedFields = servicePaymentSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) return { error: "Dados inválidos." }

    const { serviceId, clientId } = validatedFields.data
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `service-payments/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

    const { error: uploadError } = await supabaseAdmin.storage.from("financial-proofs").upload(fileName, proofFile, {
      contentType: proofFile.type,
      upsert: false,
    })
    if (uploadError) return { error: "Erro no upload." }

    const { data: urlData } = supabaseAdmin.storage.from("financial-proofs").getPublicUrl(fileName)

    const { error: updateError } = await supabaseAdmin
      .from("one_time_services")
      .update({
        received_date: new Date().toISOString().split("T")[0],
        payment_proof_url: urlData.publicUrl,
        status: "completed",
      })
      .eq("id", serviceId)

    if (updateError) return { error: updateError.message }

    revalidatePath("/dashboard/financial")
    revalidatePath(`/dashboard/clients/${clientId}`)
    return { success: "Recebimento registrado!" }
  } catch (e: any) {
    return { error: e.message }
  }
}

// --- AÇÃO undoServiceReceipt ---
const undoServiceReceiptSchema = z.object({
  serviceId: z.string().uuid(),
  clientId: z.string().uuid(),
})

export async function undoServiceReceipt(formData: FormData) {
  try {
    await checkAdminPermission()

    const validatedFields = undoServiceReceiptSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) return { error: "Dados inválidos." }

    const { serviceId, clientId } = validatedFields.data
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error: updateError } = await supabaseAdmin
      .from("one_time_services")
      .update({
        received_date: null,
        payment_proof_url: null,
        status: "pending",
      })
      .eq("id", serviceId)

    if (updateError) return { error: updateError.message }

    revalidatePath("/dashboard/financial")
    revalidatePath(`/dashboard/clients/${clientId}`)
    return { success: "Recebimento revertido!" }
  } catch (e: any) {
    return { error: e.message }
  }
}
