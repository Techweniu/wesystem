"use server"

import { generateText } from "ai"
import { z } from "zod"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { format } from "date-fns"
import OpenAI from "openai" // Declare the OpenAI variable

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

/**
 * Coleta um snapshot completo dos dados de negócio, incluindo dados sensíveis.
 */
async function getBusinessSnapshot() {
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // A busca de funcionários agora sempre inclui todos os campos, incluindo os sensíveis.
  const employeeSelect =
    "name, status, hire_date, role, department, salary, payment_day, employee_payments(payment_date, amount)"

  const { data: clients } = await supabaseAdmin
    .from("clients")
    .select("name, status, contracts(end_date, status), nps_responses(score)")
  const { data: employees } = await supabaseAdmin.from("employees").select(employeeSelect)

  return JSON.stringify(
    {
      current_date: format(new Date(), "yyyy-MM-dd"),
      clients,
      employees,
    },
    null,
    2,
  )
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})
const chatSchema = z.array(messageSchema)

export async function generateChatResponse(chatHistory: unknown) {
  const validatedHistory = chatSchema.safeParse(chatHistory)
  if (!validatedHistory.success) {
    return { error: "Formato do histórico de chat inválido." }
  }

  const businessSnapshot = await getBusinessSnapshot()
  const recentHistory = validatedHistory.data.slice(-10)

  const systemPrompt = `Você é um analista de negócios. Analise os dados da empresa fornecidos abaixo em formato JSON e responda em texto às perguntas do usuário.
  Dados: ${businessSnapshot}`

  try {
    const { text } = await generateText({
      model: "groq/llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ],
      temperature: 0.7,
    })

    if (!text) {
      return { error: "A IA não conseguiu gerar insights." }
    }

    return { success: text }
  } catch (error) {
    console.error("Erro na API do Groq:", error)
    return { error: "Ocorreu um erro ao se comunicar com a IA." }
  }
}
