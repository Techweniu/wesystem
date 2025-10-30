// sistema/app/dashboard/financial/actions.ts
"use server" // Indica que são Server Actions

import { createAdminClient } from "@/lib/supabase/server" // Helper para criar cliente Supabase Admin no servidor
// Se não estiver usando o helper, use:
// import { createClient as createAdminClient } from "@supabase/supabase-js";
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

// Função para adicionar um novo custo
export async function addCost(formData: FormData) {
  try {
    // Extrai os dados do FormData
    const rawData = {
      description: formData.get("description"),
      value: formData.get("value"), // Mantém como string para coerce fazer a conversão
      category: formData.get("category"),
      date: formData.get("date"),
      is_recurring: formData.get("is_recurring"), // Mantém como string para preprocess fazer a conversão
    }

    const validated = costSchema.safeParse(rawData) // Valida os dados com o schema Zod

    // Verifica se a validação falhou
    if (!validated.success) {
      console.error("Erro validação addCost:", validated.error.flatten().fieldErrors)
      // Retorna o primeiro erro encontrado
      const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0]
      return { success: false, error: firstError || "Dados inválidos." }
    }

    const supabaseAdmin =
      createAdminClient(
        // Se não estiver usando o helper, descomente e preencha as variáveis de ambiente:
        // process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

    // Insere o custo validado (validated.data) no banco de dados
    const { error } = await supabaseAdmin.from("costs").insert([validated.data])

    if (error) throw error // Lança erro se a inserção falhar

    revalidatePath("/dashboard/financial") // Limpa o cache da página financeira
    return { success: true, message: "Custo adicionado com sucesso!" } // Retorna sucesso com mensagem
  } catch (error) {
    console.error("Erro ao adicionar custo:", error)
    // Retorna falha com mensagem de erro
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

// --- NOVA: Ação para Marcar Pagamento do Cliente ---
// Schema para validar dados do pagamento do cliente
const clientPaymentSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."), // Garante que é um UUID
  amount: z.coerce.number().positive("O valor do pagamento deve ser positivo."), // Converte para número e valida
  // Opcional: Adicione contractId se quiser vincular o pagamento a um contrato específico
  // contractId: z.string().uuid("ID do contrato inválido.").optional().nullable(),
})

// Função para registrar o pagamento recebido de um cliente
export async function markClientPaymentAsPaid(formData: FormData) {
  // Valida os dados recebidos do formulário (botão)
  const validatedFields = clientPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    // Se a validação falhar, retorna o primeiro erro encontrado
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para registrar o pagamento." }
  }

  // Extrai os dados validados
  const { clientId, amount } = validatedFields.data
  // const { clientId, amount, contractId } = validatedFields.data; // Se usar contractId

  const supabaseAdmin =
    createAdminClient(
      // Se não estiver usando o helper, descomente e preencha as variáveis de ambiente:
      // process.env.NEXT_PUBLIC_SUPABASE_URL!,
      // process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

  // Insere o registro de pagamento na tabela client_payments
  const { error } = await supabaseAdmin.from("client_payments").insert({
    client_id: clientId,
    amount: amount,
    payment_date: new Date().toISOString(), // Usa a data/hora atual no formato ISO
    // contract_id: contractId || null, // Se usar contractId
  })

  if (error) {
    console.error("Erro Supabase (Client Payment):", error)
    return { error: `Erro ao registrar pagamento do cliente: ${error.message}` }
  }

  // Limpa o cache da página financeira para mostrar o status atualizado
  revalidatePath("/dashboard/financial")
  return { success: "Pagamento do cliente registrado com sucesso!" } // Retorna sucesso
}
// --- FIM DA NOVA Ação ---

// --- NOVA: Ação para Reverter Pagamento do Cliente ---
// Schema para validar dados para reverter pagamento do cliente
const undoClientPaymentSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
})

// Função para reverter o pagamento recebido de um cliente
export async function undoClientPayment(formData: FormData) {
  const validatedFields = undoClientPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para reverter o pagamento." }
  }

  const { clientId } = validatedFields.data

  const supabaseAdmin = createAdminClient()

  // Busca o pagamento mais recente do mês atual para este cliente
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
// --- FIM DA NOVA Ação ---

// --- NOVA: Ação para Marcar Pagamento de Custo ---
const costPaymentSchema = z.object({
  costId: z.string().uuid("ID do custo inválido."),
  amount: z.coerce.number().positive("O valor do pagamento deve ser positivo."),
})

// Função para registrar o pagamento de um custo
export async function markCostAsPaid(formData: FormData) {
  const validatedFields = costPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para registrar o pagamento." }
  }

  const { costId } = validatedFields.data

  const supabaseAdmin = createAdminClient()

  // Busca o custo para verificar se é recorrente
  const { data: cost, error: costError } = await supabaseAdmin.from("costs").select("*").eq("id", costId).single()

  if (costError || !cost) {
    return { error: "Custo não encontrado." }
  }

  // Marca o custo como pago atualizando paid_date
  const { error: paymentError } = await supabaseAdmin
    .from("costs")
    .update({ paid_date: new Date().toISOString().split("T")[0] })
    .eq("id", costId)

  if (paymentError) {
    console.error("Erro ao registrar pagamento:", paymentError)
    return { error: `Erro ao registrar pagamento: ${paymentError.message}` }
  }

  // Se for recorrente, cria uma nova ocorrência para o próximo mês
  if (cost.is_recurring) {
    const nextDate = new Date(cost.date)
    nextDate.setMonth(nextDate.getMonth() + 1)

    const { error: newCostError } = await supabaseAdmin.from("costs").insert({
      description: cost.description,
      value: cost.value,
      category: cost.category,
      date: nextDate.toISOString().split("T")[0],
      is_recurring: true,
      paid_date: null, // Nova ocorrência começa como não paga
    })

    if (newCostError) {
      console.error("Erro ao criar próxima ocorrência:", newCostError)
    }
  }

  revalidatePath("/dashboard/financial")
  return { success: "Pagamento registrado com sucesso!" }
}

// --- NOVA: Ação para Reverter Pagamento de Custo ---
const undoCostPaymentSchema = z.object({
  costId: z.string().uuid("ID do custo inválido."),
})

// Função para reverter o pagamento de um custo
export async function undoCostPayment(formData: FormData) {
  const validatedFields = undoCostPaymentSchema.safeParse(Object.fromEntries(formData))

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError || "Dados inválidos para reverter o pagamento." }
  }

  const { costId } = validatedFields.data

  const supabaseAdmin = createAdminClient()

  // Remove a data de pagamento, marcando como não pago
  const { error: updateError } = await supabaseAdmin.from("costs").update({ paid_date: null }).eq("id", costId)

  if (updateError) {
    console.error("Erro ao reverter pagamento:", updateError)
    return { error: `Erro ao reverter pagamento: ${updateError.message}` }
  }

  revalidatePath("/dashboard/financial")
  return { success: "Pagamento revertido com sucesso!" }
}
