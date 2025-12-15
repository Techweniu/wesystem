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

// --- FUNÇÃO AUXILIAR: PEGAR NOME DO APROVADOR ---
async function getApproverName() {
  const cookieStore = await cookies()
  return cookieStore.get("user_name")?.value || "Administrador"
}

// --- FUNÇÃO AUXILIAR DE DATA (Brasil) ---
function getBrazilDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
}

function addDaysToDateString(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T12:00:00")
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

const costSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.coerce.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  is_recurring: z.preprocess((val) => val === "true", z.boolean()).default(false),
  recurrence_days: z.coerce.number().min(1).max(365).default(30),
  recurrence_end_date: z.string().optional().or(z.literal('')), 
})

// --- AÇÃO addCost ---
export async function addCost(formData: FormData) {
  try {
    await checkAdminPermission()

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
      recurrence_end_date: formData.get("recurrence_end_date"),
    }

    const validated = costSchema.safeParse(rawData)

    if (!validated.success) {
      const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0]
      return { success: false, error: firstError || "Dados inválidos." }
    }

    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `costs/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`

    const blob = await put(fileName, proofFile, { access: "public" })

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const recurrenceEndDate = validated.data.recurrence_end_date || null;

    const { error } = await supabaseAdmin.from("costs").insert([
      {
        description: validated.data.description,
        value: validated.data.value,
        category: validated.data.category,
        date: validated.data.date,
        is_recurring: validated.data.is_recurring,
        recurrence_days: validated.data.is_recurring ? validated.data.recurrence_days : null,
        recurrence_end_date: validated.data.is_recurring ? recurrenceEndDate : null,
        status: "pending",
        paid_date: null,
        
        // Status de Aprovação
        approval_status: "pending", 
        approved_by: null,
        approved_at: null,

        proof_url: blob.url,
        payment_proof_url: null,
      },
    ])

    if (error) throw error

    revalidatePath("/dashboard/financial")
    return { success: true, message: "Custo enviado para aprovação!" }
  } catch (error) {
    console.error("Erro ao adicionar custo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// --- AÇÃO approveCost ---
export async function approveCost(id: string) {
  try {
    await checkAdminPermission()
    const approverName = await getApproverName()

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin
      .from("costs")
      .update({
        approval_status: "approved",
        approved_by: approverName,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/dashboard/financial")
    return { success: true, message: "Custo aprovado com sucesso!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao aprovar." }
  }
}

// --- AÇÃO rejectCost ---
export async function rejectCost(id: string) {
  try {
    await checkAdminPermission()
    const approverName = await getApproverName()

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin
      .from("costs")
      .update({
        approval_status: "rejected",
        approved_by: approverName,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/dashboard/financial")
    return { success: true, message: "Custo rejeitado." }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao rejeitar." }
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
      recurrence_end_date: formData.get("recurrence_end_date"),
    }

    const validated = costSchema.safeParse(rawData)
    if (!validated.success) return { success: false, error: "Dados inválidos." }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin.from("costs").update({
      ...validated.data,
      recurrence_end_date: validated.data.recurrence_end_date || null,
      approval_status: "pending", // Reseta aprovação
      approved_by: null,
      approved_at: null
    }).eq("id", id)

    if (error) throw error

    revalidatePath("/dashboard/financial")
    return { success: true, message: "Custo atualizado e enviado para re-aprovação!" }
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
    if (!proofFile || proofFile.size === 0) return { error: "Comprovante é obrigatório." }

    const validatedFields = clientPaymentSchema.safeParse(Object.fromEntries(formData))
    if (!validatedFields.success) return { error: "Dados inválidos." }

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
      payment_date: getBrazilDateString(),
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

    const { data: cost } = await supabaseAdmin
        .from("costs")
        .select("*, employees(payment_day)")
        .eq("id", costId)
        .single()

    if (!cost) return { error: "Custo não encontrado." }

    // CHECK: Aprovação necessária
    if (cost.approval_status !== 'approved') {
        return { error: "Este custo precisa ser aprovado pela diretoria antes do pagamento." }
    }

    const proofFile = formData.get("proof_file") as File
    if (!proofFile || proofFile.size === 0) return { error: "Comprovante obrigatório." }

    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `cost-payments/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const blob = await put(fileName, proofFile, { access: "public" })

    const { error: paymentError } = await supabaseAdmin
      .from("costs")
      .update({
        paid_date: getBrazilDateString(),
        status: "paid",
        payment_proof_url: blob.url,
      })
      .eq("id", costId)

    if (paymentError) return { error: paymentError.message }

    if (cost.is_recurring) {
      const recurrenceDays = cost.recurrence_days || 30
      let nextDateString = "";

      if (cost.employee_id && cost.employees?.payment_day) {
          const parts = cost.date.split('-')
          const year = parseInt(parts[0])
          const monthIndex = parseInt(parts[1]) - 1
          const nextPaymentDate = new Date(year, monthIndex + 1, cost.employees.payment_day, 12, 0, 0)
          nextDateString = nextPaymentDate.toISOString().split('T')[0]
      } else {
          nextDateString = addDaysToDateString(cost.date, recurrenceDays)
      }

      let shouldCreateNext = true;
      if (cost.recurrence_end_date) {
        const nextDateObj = new Date(nextDateString + "T12:00:00");
        const endDateObj = new Date(cost.recurrence_end_date + "T12:00:00");
        if (nextDateObj > endDateObj) shouldCreateNext = false;
      }

      if (shouldCreateNext) {
        await supabaseAdmin.from("costs").insert({
            description: cost.description,
            value: cost.value,
            category: cost.category,
            date: nextDateString,
            is_recurring: true,
            recurrence_days: recurrenceDays,
            recurrence_end_date: cost.recurrence_end_date,
            employee_id: cost.employee_id,
            status: "pending",
            paid_date: null,
            proof_url: cost.proof_url,
            payment_proof_url: null,
            // Novos recorrentes também precisam de aprovação
            approval_status: "pending",
            approved_by: null,
            approved_at: null,
        })
      }
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
        payment_proof_url: null,
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

    // Insere o pagamento como PENDENTE de aprovação da diretoria
    const { error } = await supabaseAdmin.from("employee_payments").insert({
      employee_id: employeeId,
      amount: amount,
      payment_date: getBrazilDateString(),
      proof_url: urlData.publicUrl,
      
      // Status de Aprovação
      approval_status: "pending",
      approved_by: null,
      approved_at: null
    })

    if (error) return { error: error.message }

    revalidatePath("/dashboard/financial")
    revalidatePath("/dashboard/team")
    return { success: "Pagamento registrado! Aguardando aprovação da diretoria." }
  } catch (e: any) {
    return { error: e.message }
  }
}

// --- NOVAS AÇÕES DE APROVAÇÃO (PAGAMENTO FUNCIONÁRIOS) ---
export async function approveEmployeePayment(id: string) {
  try {
    await checkAdminPermission()
    const approverName = await getApproverName()
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin
      .from("employee_payments")
      .update({
        approval_status: "approved",
        approved_by: approverName,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/dashboard/financial")
    revalidatePath("/dashboard/team")
    return { success: true, message: "Pagamento aprovado!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao aprovar." }
  }
}

export async function rejectEmployeePayment(id: string) {
  try {
    await checkAdminPermission()
    const approverName = await getApproverName()
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await supabaseAdmin
      .from("employee_payments")
      .update({
        approval_status: "rejected",
        approved_by: approverName,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/dashboard/financial")
    revalidatePath("/dashboard/team")
    return { success: true, message: "Pagamento rejeitado." }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro ao rejeitar." }
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
        received_date: getBrazilDateString(),
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

export async function deleteClientPayment(id: string) { return {success:false} }
