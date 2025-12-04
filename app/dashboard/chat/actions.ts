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

// Tipo para as mensagens que vêm do frontend
type Message = {
  role: "user" | "assistant"
  content: string
}

export async function generateChatResponse(messages: Message[]) {
  try {
    checkAdminPermission()

    // Pega a última mensagem do usuário (a pergunta atual)
    const lastMessage = messages[messages.length - 1]
    const userQuestion = lastMessage.content

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Busca dados para contexto (resumidos para não estourar tokens)
    const { data: financialSummary } = await supabaseAdmin.from("costs").select("value, category, date").order('date', { ascending: false }).limit(10)
    const { data: clientsSummary } = await supabaseAdmin.from("clients").select("name, status, health_status").limit(20)
    
    // Calcula totais rápidos para dar contexto macro
    const { data: allCosts } = await supabaseAdmin.from("costs").select("value")
    const totalCosts = allCosts?.reduce((acc, curr) => acc + Number(curr.value), 0) || 0

    const context = JSON.stringify({
      resumo_financeiro_recente: financialSummary,
      custo_total_acumulado: totalCosts,
      lista_clientes: clientsSummary,
    })

    // Constrói o histórico da conversa para a IA
    // Convertemos as mensagens anteriores para o formato que a IA entende no prompt
    const conversationHistory = messages.slice(0, -1).map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join("\n")

    const systemPrompt = `
      Você é um assistente de BI empresarial chamado "Wesystem AI".
      
      DADOS DO SISTEMA (Contexto Real):
      ${context}

      HISTÓRICO DA CONVERSA:
      ${conversationHistory}

      INSTRUÇÕES:
      1. Responda à pergunta atual do usuário com base nos dados acima.
      2. Se a pergunta depender de dados que não estão no contexto (ex: "qual o lucro exato de 2022"), diga que não tem essa informação no resumo atual.
      3. Seja conciso, profissional e direto.
      4. NÃO use formatação Markdown complexa (negrito, itálico), use apenas texto simples.
    `

    const { text } = await generateText({
      model: "meta/llama-3.3-70b",
      prompt: `${systemPrompt}\n\nPergunta Atual do Usuário: ${userQuestion}`,
    })

    return { success: text }
  } catch (error) {
    console.error("Erro no Chat:", error)
    return { error: error instanceof Error ? error.message : "Erro ao processar mensagem." }
  }
}
