"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers" // --- IMPORTANTE

// --- FUNÇÃO AUXILIAR DE SEGURANÇA ---
function checkAdminPermission() {
  const role = cookies().get("user_role")?.value
  if (role !== "admin") {
    throw new Error("Acesso negado: Apenas a diretoria pode consultar o assistente.")
  }
}
// ------------------------------------

export async function submitMessage(formData: FormData) {
  try {
    checkAdminPermission() // <--- PROTEÇÃO: Bloqueia usuário limitado ou anônimo

    const message = formData.get("message") as string
    
    // Conecta ao Supabase com chave de serviço para ler os dados que a IA precisa
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Busca contexto resumido (Exemplo simplificado)
    // Buscamos dados financeiros e de clientes para dar contexto à IA
    const { data: financialSummary } = await supabaseAdmin.from("costs").select("value, category").limit(20)
    const { data: clientsSummary } = await supabaseAdmin.from("clients").select("name, status").limit(20)

    const context = JSON.stringify({
      custos_recentes: financialSummary,
      clientes_recentes: clientsSummary
    })

    // 2. Chama a IA
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Você é um assistente de BI empresarial.
      Contexto de dados da empresa: ${context}
      
      Pergunta do usuário: ${message}
      
      Responda de forma concisa e profissional.`,
    })

    return { success: true, response: text }

  } catch (error) {
    console.error("Erro no Chat:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao processar mensagem." }
  }
}
