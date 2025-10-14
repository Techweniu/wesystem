"use server";

import OpenAI from "openai";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { format } from "date-fns";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Coleta um resumo completo de todos os dados de negócio do Supabase.
 */
async function getBusinessSnapshot() {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: clients } = await supabaseAdmin
    .from("clients")
    .select('name, status, contracts(name, end_date, status), nps_responses(score, response_date)');

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select('name, status, payment_day, employee_payments(payment_date)');

  const snapshot = {
    current_date: format(new Date(), "yyyy-MM-dd"),
    clients,
    employees,
  };

  return JSON.stringify(snapshot, null, 2);
}

/**
 * Gera insights de negócio usando a IA com base em um snapshot dos dados.
 */
export async function getAiInsights() {
  const businessSnapshot = await getBusinessSnapshot();

  const systemPrompt = `
    Você é um analista de negócios sênior para uma agência de marketing. Sua tarefa é analisar um snapshot dos dados da empresa em formato JSON e gerar insights acionáveis, concisos e priorizados.

    **Regras:**
    1.  Foque em alertas críticos e oportunidades de negócio.
    2.  Use o formato de lista (bullet points).
    3.  Seja direto e objetivo.
    4.  Mencione nomes de clientes ou colaboradores quando relevante.
    5.  Se nenhum insight importante for encontrado, retorne a mensagem "Nenhum insight crítico ou oportunidade identificada no momento."

    **Analise os seguintes pontos, com base na data atual (${format(new Date(), "dd/MM/yyyy")}):**
    - **Contratos a Vencer:** Identifique contratos de clientes ativos que irão expirar nos próximos 45 dias.
    - **Contratos Expirados:** Verifique se há clientes ativos com contratos já expirados.
    - **Clientes em Risco:** Aponte clientes com notas de NPS recentes (últimos 3 meses) abaixo de 7.
    - **Pagamentos de Equipe:** Verifique se o dia de pagamento de algum colaborador já passou no mês corrente e não há registro de pagamento.

    A seguir, os dados da empresa:
    ${businessSnapshot}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.5,
    });

    const insights = response.choices[0]?.message?.content;

    if (!insights) {
      return { error: "A IA não conseguiu gerar insights." };
    }

    return { success: insights };

  } catch (error) {
    console.error("Erro na API da OpenAI ao gerar insights:", error);
    return { error: "Ocorreu um erro ao se comunicar com a IA." };
  }
}
