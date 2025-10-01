"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const npsSchema = z.object({
  clientId: z.string().uuid(),
  general_score: z.coerce.number().min(0).max(10),
  conteudos_e_roteiros: z.coerce.number().min(0).max(10),
  audiovisual: z.coerce.number().min(0).max(10),
  edicao_de_videos: z.coerce.number().min(0).max(10),
  design: z.coerce.number().min(0).max(10),
  atendimento_assessor: z.coerce.number().min(0).max(10),
  atendimento_videomaker: z.coerce.number().min(0).max(10),
  comunicacao_e_presenca: z.coerce.number().min(0).max(10),
  resultado_da_parceria: z.coerce.number().min(0).max(10),
  observations: z.string().optional(),
});

export async function submitNpsForm(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = npsSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Erro de validação do NPS:", validatedFields.error.flatten().fieldErrors);
    return { error: "Dados inválidos. Por favor, preencha todos os campos de nota." };
  }

  const { clientId, general_score, observations, ...categoryScores } = validatedFields.data;

  // Calcula a média das notas das categorias para o NPS geral
  const scores = Object.values(categoryScores);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { error } = await supabaseAdmin.from("nps_responses").insert([{
    client_id: clientId,
    score: Math.round(averageScore), // Salva a média arredondada como score principal
    category_scores: categoryScores, // Salva todas as notas detalhadas
    observations: observations,
    response_date: new Date().toISOString(),
  }]);

  if (error) {
    console.error("Erro ao salvar NPS:", error);
    return { error: `Ocorreu um erro ao salvar sua resposta: ${error.message}` };
  }

  // Revalida a página do cliente para que o novo NPS apareça no histórico
  revalidatePath(`/dashboard/clients/${clientId}`);

  return { success: "Sua avaliação foi enviada com sucesso! Obrigado pelo feedback." };
}
