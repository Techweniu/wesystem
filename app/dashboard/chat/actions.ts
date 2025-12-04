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

    // 1. Busca Clientes (Resumo)
    const { data: clients } = await supabaseAdmin
      .from("clients")
      .select("name, status, health_status")
      .eq("status", "active")
      .limit(20)

    // 2. Busca Equipe (NOVO - O que faltava)
    const { data: employees } = await supabaseAdmin
      .from("employees")
      .select("name, role, status, department")
      .eq("status", "active")

    // 3. Busca Custos (Recentes e Total)
    const { data: recentCosts } = await supabaseAdmin
      .from("costs")
      .select("value, category, date, description")
      .order('date', { ascending: false })
      .limit(5)
    
    const { data: allCosts } = await supabaseAdmin.from("costs").select("value")
    const totalCustos = allCosts?.reduce((acc, curr) => acc + Number(curr.value), 0) || 0

    // 4. Busca Receita/Contratos (NOVO - Para mostrar valores positivos)
    const { data: activeContracts } = await supabaseAdmin
      .from("contracts")
      .select("valor_mensal")
      .eq("status", "active")
    
    const mrrTotal = activeContracts?.reduce((acc, curr) => acc + Number(curr.valor_mensal), 0) || 0

    // Monta o contexto rico para a IA
    const context = JSON.stringify({
      equipe: employees?.map(e => `${e.name} (${e.role} - ${e.department || 'Geral'})`),
      clientes_ativos: clients?.map(c => c.name),
      financeiro: {
        mrr_atual_mensal: mrrTotal,
        custo_total_historico: totalCustos,
        ultimos_custos: recentCosts
      }
    }, null, 2) // null, 2 para formatar bonito o JSON dentro do prompt

    // Constrói o histórico da conversa
    const conversationHistory = messages.slice(0, -1).map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join("\n")

    const systemPrompt = `
      Você é um assistente de BI empresarial chamado "Wesystem AI", alimentado pelo modelo GPT-OSS-120b.
      
      DADOS ATUAIS DA EMPRESA (Contexto Real):
      ${context}

      HISTÓRICO DA CONVERSA:
      ${conversationHistory}

      INSTRUÇÕES:
      1. Use os dados acima para responder. Se perguntarem "quem é meu funcionário", liste os nomes em 'equipe'.
      2. Se perguntarem de "valores", fale do MRR (Receita Recorrente) e compare com os custos se fizer sentido.
      3. Seja direto e profissional.
      4. NÃO invente dados que não estão no contexto.
    `

    const { text } = await generateText({
      model: "gpt-oss-120b",
      prompt: `${systemPrompt}\n\nPergunta Atual do Usuário: ${userQuestion}`,
    })

    return { success: text }
  } catch (error) {
    console.error("Erro no Chat:", error)
    return { error: error instanceof Error ? error.message : "Erro ao processar mensagem." }
  }
}
