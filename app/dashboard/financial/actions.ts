// sistema/app/dashboard/financial/actions.ts
"use server" // Indica que são Server Actions

import { createAdminClient } from "@/lib/supabase/server" // Helper para criar cliente Supabase Admin no servidor
import { revalidatePath } from "next/cache" // Função para limpar o cache de rotas específicas
import { z } from "zod" // Biblioteca para validação de schemas

// --- Ações de Custo Existentes (Mantê-las) ---
// Schema para validar dados de custo
const costSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.coerce.number().positive("Valor deve ser positivo"), // Use coerce para converter string para número
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"), // Validação de formato de data pode ser adicionada
  is_recurring: z.preprocess((val) => val === "true", z.boolean()).default(false), // Processa strings 'true'/'false' para booleano
})

// --- AÇÃO addCost ATUALIZADA ---
// Função para adicionar um novo custo
export async function addCost(formData: FormData) {
  try {
    // --- LÓGICA DE ARQUIVO REMOVIDA ---
    // const proofFile = formData.get("proof_file") as File
    // if (!proofFile || proofFile.size === 0) {
    //   return { success: false, error: "Comprovante de pagamento é obrigatório." }
    // }
    // if (proofFile.size > 10 * 1024 * 1024) {
    //   return { success: false, error: "O arquivo deve ter no máximo 10MB." }
    // }

    const rawData = {
      description: formData.get("description"),
      value: formData.get("value"),
      category: formData.get("category"),
      date: formData.get("date"),
      is_recurring: formData.get("is_recurring"),
    }

    const validated = costSchema.safeParse(rawData)

    if (!validated.success) {
      console.error("Erro validação addCost:", validated.error.flatten().fieldErrors)
      const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0]
      return { success: false, error: firstError || "Dados inválidos." }
    }

    const supabaseAdmin = createAdminClient()

    // --- LÓGICA DE STORAGE REMOVIDA ---
    // const fileExtension = proofFile.name.split(".").pop()
    // const fileName = ...
    // const filePath = ...
    // const { error: uploadError } = await supabaseAdmin.storage...
    // const { data: urlData } = supabaseAdmin.storage...

    // --- LÓGICA DE INSERT ATUALIZADA ---
    const { error } = await supabaseAdmin.from("costs").insert([
      {
        ...validated.data,
        status: "pending", // Define explicitamente como pendente
        paid_date: null, // Garante que a data de pagamento é nula
        proof_url: null, // Garante que a URL é nula
      },
    ])

    if (error) throw error

    revalidatePath("/dashboard/financial")
    return { success: true, message: "Custo adicionado com sucesso!" }
  } catch (error) {
    console.error("Erro ao adicionar custo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao adicionar custo" }
  }
}

// Função para atualizar um custo existente
export async function updateCost(id: string, formData: FormData) {
  try {
    // Extrai os dados do FormData
    const rawData = {
      description: formData.get("description"),
      value: formData.get("value"), // Mantém como string para coerce
      category: formData.get("category"),
      date: formData.get("date"),
      is_recurring: formData.get("is_recurring"), // Mantém como string para preprocess
    }

    const validated = costSchema.safeParse(rawData) // Valida os dados

    // Verifica falha na validação
    if (!validated.success) {
      console.error("Erro validação updateCost:", validated.error.flatten().fieldErrors)
      const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0]
      return { success: false, error: firstError || "Dados inválidos." }
    }

    const supabaseAdmin =
      createAdminClient(
        // process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

    // Atualiza o custo no banco onde o ID corresponde
    const { error } = await supabaseAdmin.from("costs").update(validated.data).eq("id", id)

    if (error) throw error // Lança erro se a atualização falhar

    revalidatePath("/dashboard/financial") // Limpa cache
    return { success: true, message: "Custo atualizado com sucesso!" } // Retorna sucesso
  } catch (error) {
    console.error("Erro ao atualizar custo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar custo" }
  }
}

// Função para deletar um custo
export async function deleteCost(id: string) {
  try {
    // Validação simples do ID (verifica se é uma string não vazia)
    if (!id || typeof id !== "string") {
      return { success: false, error: "ID inválido fornecido." }
    }

    const supabaseAdmin =
      createAdminClient(
        // process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

    // Deleta o custo do banco onde o ID corresponde
    const { error } = await supabaseAdmin.from("costs").delete().eq("id", id)

    if (error) throw error // Lança erro se a deleção falhar

    revalidatePath("/dashboard/financial") // Limpa cache
    return { success: true, message: "Custo deletado com sucesso!" } // Adiciona mensagem de sucesso
  } catch (error) {
    console.error("Erro ao deletar custo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao deletar custo" }
  }
}

// --- Fim das Ações de Custo Existentes ---

// --- Ação para Marcar Pagamento do Cliente ---
const clientPaymentSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  amount: z.coerce.number().positive("O valor do pagamento deve ser positivo."),
})

export async function markClientPaymentAsPaid(formData: FormData) {
  const proofFile = formData.get("proof_file") as File
  if (!proofFile || proofFile.size === 0) {
    return { error: "Comprovante de recebimento é obrigatório." }
  }

  if (proofFile.size > 10 * 1024 * 1024) {
    return { error: "O arquivo deve ter no máximo 10MB." }
  }

  const validatedFields = clientPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para registrar o pagamento." }
  }

  const { clientId, amount } = validatedFields.data

  try {
    const supabaseAdmin = createAdminClient()

    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `client-payments/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage.from("financial-proofs").upload(filePath, proofFile, {
      contentType: proofFile.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError)
      return { error: "Erro ao fazer upload do comprovante." }
    }

    const { data: urlData } = supabaseAdmin.storage.from("financial-proofs").getPublicUrl(filePath)

    const { error } = await supabaseAdmin.from("client_payments").insert({
      client_id: clientId,
      amount: amount,
      payment_date: new Date().toISOString(),
      proof_url: urlData.publicUrl,
    })

    if (error) {
      console.error("Erro Supabase (Client Payment):", error)
      return { error: `Erro ao registrar pagamento do cliente: ${error.message}` }
    }

    revalidatePath("/dashboard/financial")
    return { success: "Pagamento do cliente registrado com sucesso!" }
  } catch (error) {
    console.error("Erro ao processar pagamento:", error)
    return { error: "Erro ao processar pagamento." }
  }
}

// --- Ação para Reverter Pagamento do Cliente ---
const undoClientPaymentSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
})

export async function undoClientPayment(formData: FormData) {
  const validatedFields = undoClientPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para reverter o pagamento." }
  }

  const { clientId } = validatedFields.data

  const supabaseAdmin = createAdminClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: recentPayment, error: fetchError } = await supabaseAdmin
    .from("client_payments")
    .select("id")
    .eq("client_id", clientId)
    .gte("payment_date", startOfMonth.toISOString())
    .order("payment_date", { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !recentPayment) {
    return { error: "Nenhum pagamento encontrado para reverter neste mês." }
  }

  const { error: deleteError } = await supabaseAdmin.from("client_payments").delete().eq("id", recentPayment.id)

  if (deleteError) {
    console.error("Erro ao reverter pagamento:", deleteError)
    return { error: `Erro ao reverter pagamento: ${deleteError.message}` }
  }

  revalidatePath("/dashboard/financial")
  return { success: "Pagamento revertido com sucesso!" }
}

// --- AÇÃO markCostAsPaid ATUALIZADA ---
// --- Ação para Marcar Pagamento de Custo ---
const costPaymentSchema = z.object({
  costId: z.string().uuid("ID do custo inválido."),
  amount: z.coerce.number().positive("O valor do pagamento deve ser positivo."),
})

export async function markCostAsPaid(formData: FormData) {
  const validatedFields = costPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para registrar o pagamento." }
  }

  const { costId } = validatedFields.data

  const supabaseAdmin = createAdminClient()

  const { data: cost, error: costError } = await supabaseAdmin.from("costs").select("*").eq("id", costId).single()

  if (costError || !cost) {
    return { error: "Custo não encontrado." }
  }

  const proofFile = formData.get("proof_file") as File
  if (!proofFile || proofFile.size === 0) {
    return { error: "Comprovante de pagamento é obrigatório." }
  }

  if (proofFile.size > 10 * 1024 * 1024) {
    return { error: "O arquivo deve ter no máximo 10MB." }
  }

  try {
    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `cost-payments/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage.from("financial-proofs").upload(filePath, proofFile, {
      contentType: proofFile.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError)
      return { error: "Erro ao fazer upload do comprovante." }
    }

    // --- LÓGICA DE UPLOAD ATUALIZADA ---
    const { data: urlData } = supabaseAdmin.storage.from("financial-proofs").getPublicUrl(filePath)

    const { error: paymentError } = await supabaseAdmin
      .from("costs")
      .update({
        paid_date: new Date().toISOString().split("T")[0],
        status: "paid", // Define o status como pago
        proof_url: urlData.publicUrl, // Salva a URL do comprovante
      })
      .eq("id", costId)
    // --- FIM DA ATUALIZAÇÃO ---

    if (paymentError) {
      console.error("Erro ao registrar pagamento:", paymentError)
      return { error: `Erro ao registrar pagamento: ${paymentError.message}` }
    }

    if (cost.is_recurring) {
      const nextDate = new Date(cost.date)
      nextDate.setMonth(nextDate.getMonth() + 1)

      const { error: newCostError } = await supabaseAdmin.from("costs").insert({
        description: cost.description,
        value: cost.value,
        category: cost.category,
        date: nextDate.toISOString().split("T")[0],
        is_recurring: true,
        paid_date: null,
        status: "pending", // Custo futuro nasce como pendente
        proof_url: null,
      })

      if (newCostError) {
        console.error("Erro ao criar próxima ocorrência:", newCostError)
      }
    }

    revalidatePath("/dashboard/financial")
    return { success: "Pagamento registrado com sucesso!" }
  } catch (error) {
    console.error("Erro ao processar pagamento:", error)
    return { error: "Erro ao processar pagamento." }
  }
}

// --- Ação para Reverter Pagamento de Custo ---
const undoCostPaymentSchema = z.object({
  costId: z.string().uuid("ID do custo inválido."),
})

export async function undoCostPayment(formData: FormData) {
  const validatedFields = undoCostPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para reverter o pagamento." }
  }

  const { costId } = validatedFields.data

  const supabaseAdmin = createAdminClient()
  
  // TODO: Idealmente, deveríamos deletar o comprovante do Storage aqui
  // (Omitido por simplicidade, mas é uma melhoria recomendada)

  // Atualiza o status para pendente e remove a data de pagamento e comprovante
  const { error: updateError } = await supabaseAdmin
    .from("costs")
    .update({ 
      paid_date: null,
      status: 'pending',
      proof_url: null
    })
    .eq("id", costId)

  if (updateError) {
    console.error("Erro ao reverter pagamento:", updateError)
    return { error: `Erro ao reverter pagamento: ${updateError.message}` }
  }

  revalidatePath("/dashboard/financial")
  return { success: "Pagamento revertido com sucesso!" }
}

// --- Ação para Marcar Pagamento de Funcionário ---
const paymentSchema = z.object({
  employeeId: z.string().uuid(),
  amount: z.coerce.number().positive("O valor do pagamento deve ser positivo."),
})

export async function markPaymentAsPaid(formData: FormData) {
  const proofFile = formData.get("proof_file") as File
  if (!proofFile || proofFile.size === 0) {
    return { error: "Comprovante de pagamento é obrigatório." }
  }

  if (proofFile.size > 10 * 1024 * 1024) {
    return { error: "O arquivo deve ter no máximo 10MB." }
  }

  const validatedFields = paymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para registrar o pagamento." }
  }

  const { employeeId, amount } = validatedFields.data

  try {
    const supabaseAdmin = createAdminClient()

    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `employee-payments/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage.from("financial-proofs").upload(filePath, proofFile, {
      contentType: proofFile.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError)
      return { error: "Erro ao fazer upload do comprovante." }
    }

    const { data: urlData } = supabaseAdmin.storage.from("financial-proofs").getPublicUrl(filePath)

    const { error } = await supabaseAdmin.from("employee_payments").insert({
      employee_id: employeeId,
      amount: amount,
      payment_date: new Date().toISOString(),
      proof_url: urlData.publicUrl,
    })

    if (error) {
      console.error("Erro Supabase (Pagamento):", error)
      return { error: `Erro ao registrar pagamento: ${error.message}` }
    }

    // ===================================
    // --- CORREÇÃO APLICADA AQUI ---
    // ===================================
    revalidatePath("/dashboard/financial") // <-- Adicionada esta linha
    revalidatePath("/dashboard/team")
    revalidatePath(`/dashboard/team/${employeeId}`)
    return { success: "Pagamento registrado com sucesso!" }
  } catch (error) {
    console.error("Erro ao processar pagamento:", error)
    return { error: "Erro ao processar pagamento." }
  }
}

// --- AÇÃO PARA REVERTER PAGAMENTO (MOVIDA DE team/actions.ts) ---
const undoPaymentSchema = z.object({
  employeeId: z.string().uuid("ID do funcionário inválido."),
})

export async function undoEmployeePayment(formData: FormData) {
  const validatedFields = undoPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para reverter o pagamento." }
  }

  const { employeeId } = validatedFields.data

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: recentPayment, error: fetchError } = await supabaseAdmin
    .from("employee_payments")
    .select("id")
    .eq("employee_id", employeeId)
    .gte("payment_date", startOfMonth.toISOString())
    .order("payment_date", { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !recentPayment) {
    return { error: "Nenhum pagamento encontrado para reverter neste mês." }
  }
  
  // TODO: Idealmente, deveríamos deletar o comprovante do Storage aqui

  const { error: deleteError } = await supabaseAdmin.from("employee_payments").delete().eq("id", recentPayment.id)

  if (deleteError) {
    console.error("Erro ao reverter pagamento:", deleteError)
    return { error: `Erro ao reverter pagamento: ${deleteError.message}` }
  }

  revalidatePath("/dashboard/financial")
  revalidatePath("/dashboard/team")
  revalidatePath(`/dashboard/team/${employeeId}`)
  return { success: "Pagamento revertido com sucesso!" }
}

// ==========================================================
// --- NOVAS AÇÕES PARA SERVIÇOS PONTUAIS ---
// ==========================================================

// Schema para marcar recebimento de serviço pontual
const servicePaymentSchema = z.object({
  serviceId: z.string().uuid("ID do serviço inválido."),
  clientId: z.string().uuid("ID do cliente inválido."),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
})

// Ação para marcar um serviço pontual como RECEBIDO
export async function markServiceAsReceived(formData: FormData) {
  const proofFile = formData.get("proof_file") as File
  if (!proofFile || proofFile.size === 0) {
    return { error: "Comprovante de recebimento é obrigatório." }
  }
  if (proofFile.size > 10 * 1024 * 1024) {
    return { error: "O arquivo deve ter no máximo 10MB." }
  }

  const validatedFields = servicePaymentSchema.safeParse(Object.fromEntries(formData))
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos." }
  }

  const { serviceId, clientId, amount } = validatedFields.data

  try {
    const supabaseAdmin = createAdminClient()

    // 1. Upload do comprovante
    const fileExtension = proofFile.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `service-payments/${fileName}` // Pasta dedicada

    const { error: uploadError } = await supabaseAdmin.storage.from("financial-proofs").upload(filePath, proofFile, {
      contentType: proofFile.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("Erro ao fazer upload (serviço):", uploadError)
      return { error: "Erro ao fazer upload do comprovante." }
    }

    const { data: urlData } = supabaseAdmin.storage.from("financial-proofs").getPublicUrl(filePath)

    // 2. Atualiza a tabela one_time_services
    const { error: updateError } = await supabaseAdmin
      .from("one_time_services")
      .update({
        received_date: new Date().toISOString().split("T")[0],
        payment_proof_url: urlData.publicUrl,
        status: "completed", // Define o status como 'completed' ao receber
      })
      .eq("id", serviceId)

    if (updateError) {
      console.error("Erro Supabase (markServiceAsReceived):", updateError)
      // Tenta deletar o arquivo órfão se a atualização do DB falhar
      await supabaseAdmin.storage.from("financial-proofs").remove([filePath])
      return { error: `Erro ao registrar recebimento: ${updateError.message}` }
    }

    // Revalida ambas as páginas
    revalidatePath("/dashboard/financial")
    revalidatePath(`/dashboard/clients/${clientId}`)
    return { success: "Recebimento do serviço registrado com sucesso!" }
  } catch (error) {
    console.error("Erro ao processar recebimento:", error)
    return { error: "Erro ao processar recebimento." }
  }
}

// Schema para reverter recebimento de serviço pontual
const undoServiceReceiptSchema = z.object({
  serviceId: z.string().uuid("ID do serviço inválido."),
  clientId: z.string().uuid("ID do cliente inválido."),
})

// Ação para reverter o recebimento de um serviço pontual
export async function undoServiceReceipt(formData: FormData) {
  const validatedFields = undoServiceReceiptSchema.safeParse(Object.fromEntries(formData))
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos." }
  }

  const { serviceId, clientId } = validatedFields.data

  const supabaseAdmin = createAdminClient()

  // TODO: Idealmente, deveríamos deletar o comprovante do Storage aqui
  // (Omitido por simplicidade, mas é uma melhoria recomendada)

  // 2. Atualiza a tabela one_time_services
  const { error: updateError } = await supabaseAdmin
    .from("one_time_services")
    .update({
      received_date: null,
      payment_proof_url: null,
      status: "pending", // Reverte o status para 'pending'
    })
    .eq("id", serviceId)

  if (updateError) {
    console.error("Erro Supabase (undoServiceReceipt):", updateError)
    return { error: `Erro ao reverter recebimento: ${updateError.message}` }
  }

  // Revalida ambas as páginas
  revalidatePath("/dashboard/financial")
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: "Recebimento do serviço revertido!" }
}
