"use server";

import OpenAI from "openai";
import { z } from "zod";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function getBusinessContext() {
  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: clients, error } = await supabaseAdmin
      .from("clients")
      .select(`
        name, status, objectives,
        contracts ( valor_mensal, status ),
        one_time_services ( value, status )
      `);

    if (error) {
      console.error("Erro ao buscar dados do Supabase:", error);
      return "Não foi possível buscar os dados dos clientes.";
    }

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

    return JSON.stringify(summary, null, 2);
  } catch (e) {
    console.error("Erro ao processar contexto de negócio:", e);
    return "Erro ao processar os dados internos.";
  }
}

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

  const businessContext = await getBusinessContext();

  const messagesWithSystemPrompt = [
    {
      role: "system" as const,
      content: `Você é um assistente de Business Intelligence. Sua principal função é analisar os dados fornecidos e responder a perguntas em texto. 
      Baseie suas respostas estritamente nos dados de contexto abaixo. Seja claro e objetivo.
      ### Contexto de Dados (em formato JSON):
      ${businessContext}`,
    },
    ...validatedHistory.data,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messagesWithSystemPrompt,
      // Não forçamos mais a resposta em JSON
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
