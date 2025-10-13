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
        nome: client.name, status: client.status, mrr: mrr,
        receitaPontualTotal: oneTimeRevenue, objetivos: client.objectives,
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
  content: z.any(), // Alterado para 'any' para aceitar strings ou objetos de gráfico
});
const chatSchema = z.array(messageSchema);

export async function generateChatResponse(chatHistory: unknown) {
  const validatedHistory = chatSchema.safeParse(chatHistory);
  if (!validatedHistory.success) {
    return { error: "Formato do histórico de chat inválido." };
  }

  const businessContext = await getBusinessContext();
  
  // Remove respostas anteriores que eram gráficos para não poluir o histórico
  const cleanHistory = validatedHistory.data.map(msg => ({
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : "Gráfico exibido anteriormente."
  }));

  const messagesWithSystemPrompt = [
    {
      role: "system" as const,
      content: `Você é um assistente de BI. Se o usuário pedir por um gráfico, sua única resposta DEVE ser um JSON formatado com a seguinte estrutura: {"type": "chart", "chartType": "bar" | "pie", "data": [...], "config": {"dataKey": "...", "categoryKey": "..."}}. 
      - 'bar': para gráficos de barra. 'data' deve ser um array de objetos.
      - 'pie': para gráficos de pizza. 'data' deve ser um array de objetos com 'name' e 'value'.
      Se o pedido não for um gráfico, responda normalmente em texto. Baseie-se estritamente no contexto:
      ${businessContext}`,
    },
    ...cleanHistory,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messagesWithSystemPrompt,
      // Habilita o modo JSON para forçar a IA a responder com um JSON válido quando instruída
      response_format: { type: "json_object" },
    });

    const assistantResponse = response.choices[0]?.message?.content;
    if (!assistantResponse) {
      return { error: "A IA não conseguiu gerar uma resposta." };
    }

    // Tenta interpretar a resposta como JSON. Se falhar, trata como texto normal.
    try {
      const jsonResponse = JSON.parse(assistantResponse);
      // Valida se o JSON é um gráfico
      if (jsonResponse.type === 'chart') {
        return { success: jsonResponse };
      }
      // Se for um JSON mas não um gráfico, retorna o texto
      return { success: assistantResponse };
    } catch (e) {
      // Se não for JSON, é uma resposta de texto normal
      return { success: assistantResponse };
    }

  } catch (error) {
    console.error("Erro na API da OpenAI:", error);
    return { error: "Ocorreu um erro ao se comunicar com a IA." };
  }
}
