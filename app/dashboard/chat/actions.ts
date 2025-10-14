"use server";

import OpenAI from "openai";
import { z } from "zod";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { format } from "date-fns";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Coleta um snapshot dos dados, opcionalmente incluindo dados sensíveis.
 */
async function getBusinessSnapshot(includeSensitiveData: boolean = false) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Seleciona os campos base
  let employeeSelect = 'name, status, hire_date';
  // Se a permissão for concedida, adiciona os campos sensíveis
  if (includeSensitiveData) {
    employeeSelect += ', salary, payment_day, employee_payments(payment_date, amount)';
  }

  const { data: clients } = await supabaseAdmin.from("clients").select('name, status, contracts(end_date, status), nps_responses(score)');
  const { data: employees } = await supabaseAdmin.from("employees").select(employeeSelect);

  return JSON.stringify({
    current_date: format(new Date(), "yyyy-MM-dd"),
    clients,
    employees,
  }, null, 2);
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
  
  const userMessage = validatedHistory.data[validatedHistory.data.length - 1].content;
  const sensitiveKeywords = ['salário', 'salarios', 'pagamento', 'pagamentos', 'custo', 'custos', 'remuneração'];
  const requiresPassword = sensitiveKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
  
  // --- ALTERAÇÃO DE SEGURANÇA APLICADA AQUI ---
  // A senha agora é lida da variável de ambiente e nunca fica exposta no código.
  const password = process.env.SENSITIVE_DATA_PASSWORD;

  // Validação para garantir que a senha foi configurada no servidor
  if (requiresPassword && !password) {
      console.error("ERRO DE SEGURANÇA: A variável de ambiente SENSITIVE_DATA_PASSWORD não está configurada.");
      return { error: "A funcionalidade de acesso a dados sensíveis não está configurada corretamente pelo administrador." };
  }

  let businessSnapshot;
  let finalUserMessage = userMessage;

  // LÓGICA DE SEGURANÇA
  if (requiresPassword) {
    if (userMessage.toLowerCase().includes(password!)) { // O '!' garante ao TypeScript que a variável existe
      // Senha correta: remove a senha da pergunta e inclui dados sensíveis
      finalUserMessage = userMessage.replace(new RegExp(password!, 'ig'), '').trim();
      businessSnapshot = await getBusinessSnapshot(true);
    } else {
      // Senha necessária, mas não fornecida: retorna o prompt de senha
      return { success: { type: 'password_prompt' } };
    }
  } else {
    // Não requer senha: busca dados normais
    businessSnapshot = await getBusinessSnapshot(false);
  }

  const cleanHistory = validatedHistory.data.slice(0, -1);
  cleanHistory.push({ role: 'user', content: finalUserMessage });

  const systemPrompt = `Você é um analista de negócios. Analise os dados da empresa e responda em texto. Se você não tiver acesso a dados sensíveis (como salários), informe ao usuário que a informação é protegida e que ele precisa fornecer a senha junto com a pergunta para acessá-la. Dados: ${businessSnapshot}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...cleanHistory
      ],
    });

    const insights = response.choices[0]?.message?.content;
    if (!insights) {
      return { error: "A IA não conseguiu gerar insights." };
    }

    return { success: { type: 'text', content: insights } };

  } catch (error) {
    console.error("Erro na API da OpenAI:", error);
    return { error: "Ocorreu um erro ao se comunicar com a IA." };
  }
}
