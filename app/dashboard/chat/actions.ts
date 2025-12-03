"use server"

import { generateText } from "ai"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// --- FUNÇÃO AUXILIAR DE SEGURANÇA ---
function checkAdminPermission() {
  const role = cookies().get("user_role")?.value
  if (role !== "admin") {
    throw new Error("Acesso negado: Apenas a diretoria pode consultar o assistente.")
  }
}
// ------------------------------------

export async function generateChatResponse(formData: FormData) {
  return submitMessage(formData)
}

export async function submitMessage(formData: FormData) {
  try {
    checkAdminPermission()

    const message = formData.get("message") as string

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: financialSummary } = await supabaseAdmin.from("costs").select("value, category").limit(20)
    const { data: clientsSummary } = await supabaseAdmin.from("clients").select("name, status").limit(20)

    const context = JSON.stringify({
      custos_recentes: financialSummary,
      clientes_recentes: clientsSummary,
    })

    const { text } = await generateText({
      model: "meta/llama-3.3-70b",
      system:
        "Você é um assistente de BI empresarial. Responda de forma concisa e profissional, sem usar formatação markdown (sem negrito, itálico, títulos ou listas com marcadores). Use apenas texto simples e direto.",
      prompt: `Contexto de dados da empresa: ${context}
      
      Pergunta do usuário: ${message}`,
    })

    return { success: true, response: text }
  } catch (error) {
    console.error("Erro no Chat:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao processar mensagem." }
  }
}
