"use server";

import OpenAI from "openai";
import { z } from "zod";

// Inicializa o cliente da OpenAI com a chave de API e a opção de segurança
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // <-- CORREÇÃO ADICIONADA AQUI
});

// Define a estrutura esperada para as mensagens
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatSchema = z.array(messageSchema);

export async function generateChatResponse(chatHistory: unknown) {
  // Validação dos dados de entrada
  const validatedHistory = chatSchema.safeParse(chatHistory);

  if (!validatedHistory.success) {
    return { error: "Formato do histórico de chat inválido." };
  }

  // Adiciona uma instrução inicial para o sistema (opcional, mas recomendado)
  const messagesWithSystemPrompt = [
    {
      role: "system" as const, // Define o papel como 'system'
      content: "Você é um assistente prestativo focado em análise de dados e business intelligence para agências de marketing.",
    },
    ...validatedHistory.data,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Você pode usar "gpt-3.5-turbo" se preferir
      messages: messagesWithSystemPrompt,
      temperature: 0.7, // Controla a criatividade da resposta
      max_tokens: 1000, // Limita o tamanho da resposta
    });

    const assistantResponse = response.choices[0]?.message?.content;

    if (!assistantResponse) {
      return { error: "A IA não conseguiu gerar uma resposta." };
    }

    return { success: assistantResponse };

  } catch (error) {
    console.error("Erro na API da OpenAI:", error);
    return { error: "Ocorreu um erro ao se comunicar com a IA. Verifique sua chave de API e tente novamente." };
  }
}
