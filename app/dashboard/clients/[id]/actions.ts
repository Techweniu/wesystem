"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// --- Action para Serviço Pontual (já existente) ---
const oneTimeServiceSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(3, "O nome do serviço é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.string().min(1, "A data é obrigatória."),
  status: z.enum(["pending", "completed", "cancelled"]),
})

export async function addOneTimeService(formData: FormData) {
  // ... (código desta função permanece o mesmo)
}


// --- NOVA ACTION PARA O NPS INTERNO ---
const npsSchema = z.object({
  clientId: z.string().uuid(),
  "Conteúdos e Roteiros": z.coerce.number().min(0).max(10),
  "Audiovisual": z.coerce.number().min(0).max(10),
  "Edição de Vídeos": z.coerce.number().min(0).max(10),
  "Design": z.coerce.number().min(0).max(10),
  "Atendimento Assessor": z.coerce.number().min(0).max(10),
  "Atendimento VideoMaker": z.coerce.number().min(0).max(10),
  "Comunicação e Presença": z.coerce.number().min(0).max(10),
  "Resultado da Parceria": z.coerce.number().min(0).max(10),
  observations: z.string().optional(),
});

export async function addNpsResponse(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = npsSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Erro de validação do NPS:", validatedFields.error.flatten().fieldErrors);
    return { error: "Dados inválidos. Todas as notas de 0 a 10 são obrigatórias." };
  }

  const { clientId, observations, ...categoryScores } = validatedFields.data;

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
    category_scores: categoryScores, // Salva todas as notas detalhadas em JSON
    observations: observations,
    response_date: new Date().toISOString(),
  }]);

  if (error) {
    console.error("Erro ao salvar NPS:", error);
    return { error: `Ocorreu um erro ao salvar a avaliação: ${error.message}` };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);

  return { success: "Avaliação NPS salva com sucesso!" };
}
