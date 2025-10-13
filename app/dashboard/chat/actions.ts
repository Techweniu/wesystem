"use server";

import OpenAI from "openai";
import { z } from "zod";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Inicializa o cliente da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Busca um resumo dos dados de clientes no Supabase para dar contexto à IA.
 */
async function getBusinessContext() {
  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Busca clientes e seus contratos e serviços associados
    const { data: clients, error } = await supabaseAdmin
      .from("clients")
      .select(`
        name,
        status,
        objectives,
        contracts ( valor_mensal, status ),
        one_time_services ( value, status )
      `);

    if (error) {
      console.error("Erro ao buscar dados do Supabase:", error);
      return "Não foi possível buscar os dados dos clientes.";
    }

    // Processa os dados para criar um resumo mais simples
    const summary = clients.map(client => {
      const mrr = client.contracts
        .filter(c => c.status === 'active')
        .reduce((sum, c) => sum + (c.valor_mensal || 0), 0);
      
      const oneTimeRevenue = client.one_time_services
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.value || 0), 0);

      return {
        nome: client.name,
        status: client.status,
        mrr: mrr,
        receitaPontualTotal: oneTimeRevenue,
        objetivos: client.objectives,
      };
    });

    // Retorna o resumo como uma string JSON para ser usada no prompt
    return JSON.stringify(summary, null, 2);

  } catch (e) {
    console.error("Erro ao processar contexto de negócio:", e);
    return "Erro ao processar os dados internos.";
  }
}


// Schema de validação (sem alterações)
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
const chatSchema = z.array(messageSchema);


export async function generateChatResponse(chatHistory: unknown) {
  const validatedHistory = chatSchema.safeParse(chatHistory);

  if (!validatedHistory.success) {
    return { error: "Formato do histórico de chat inválido." };
  }

  // 1. Busca o contexto atualizado do seu banco de dados
  const businessContext = await getBusinessContext();

  // 2. Monta o prompt do sistema, agora com os dados do Supabase
  const messagesWithSystemPrompt = [
    {
      role: "system" as const,
      content: `Você é um assistente de Business Intelligence. Sua principal função é analisar os dados fornecidos e responder a perguntas sobre eles. 
      Baseie suas respostas estritamente nos dados de contexto abaixo. Não invente informações.

      ### Contexto de Dados (em formato JSON):
      ${businessContext}
      `,
    },
    ...validatedHistory.data,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messagesWithSystemPrompt,
      temperature: 0.5,
      max_tokens: 1500,
    });

    const assistantResponse = response.choices[0]?.message?.content;

    if (!assistantResponse) {
      return { error: "A IA não conseguiu gerar uma resposta." };
    }

    return { success: assistantResponse };

  } catch (error) {
    console.error("Erro na API da OpenAI:", error);
    return { error: "Ocorreu um erro ao se comunicar com a IA." };
  }
}
