"use server";

import OpenAI from "openai";
import { z } from "zod";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { format } from "date-fns";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function getBusinessSnapshot(includeSensitiveData: boolean = false) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  let employeeSelect = 'name, status, hire_date';
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
  const password = process.env.SENSITIVE_DATA_PASSWORD;

  if (requiresPassword && !password) {
      return { error: "Funcionalidade de acesso a dados sensíveis não configurada." };
  }

  let businessSnapshot;
  let finalUserMessage = userMessage;

  if (requiresPassword) {
    if (userMessage.toLowerCase().includes(password!)) {
      finalUserMessage = userMessage.replace(new RegExp(password!, 'ig'), '').trim();
      businessSnapshot = await getBusinessSnapshot(true);
    } else {
      // A RESPOSTA AGORA É UM TEXTO SIMPLES, NÃO UM OBJETO
      return { success: "Para acessar esta informação, por favor, digite sua pergunta novamente incluindo a palavra-passe de segurança." };
    }
  } else {
    businessSnapshot = await getBusinessSnapshot(false);
  }

  const fullHistory = validatedHistory.data.slice(0, -1);
  fullHistory.push({ role: 'user', content: finalUserMessage });
  const recentHistory = fullHistory.slice(-10);

  const systemPrompt = `Você é um analista de negócios. Analise os dados da empresa e responda em texto. Se você não tiver acesso a dados sensíveis (como salários), informe ao usuário que a informação é protegida. Dados: ${businessSnapshot}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory
      ],
    });

    const insights = response.choices[0]?.message?.content;
    if (!insights) {
      return { error: "A IA não conseguiu gerar insights." };
    }

    // A RESPOSTA É SEMPRE UM TEXTO SIMPLES
    return { success: insights };

  } catch (error) {
    console.error("Erro na API da OpenAI:", error);
    return { error: "Ocorreu um erro ao se comunicar com a IA." };
  }
}
