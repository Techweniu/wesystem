"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// --- Action para Serviço Pontual ---
const oneTimeServiceSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  name: z.string().min(3, "O nome do serviço é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser maior que zero."),
  date: z.string().min(1, "A data é obrigatória."),
  status: z.enum(["pending", "completed", "cancelled"], {
    errorMap: () => ({ message: "Status inválido." }),
  }),
})

export async function addOneTimeService(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())
  const validatedFields = oneTimeServiceSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }
  
  const { clientId, name, value, date, status } = validatedFields.data;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { error } = await supabaseAdmin.from("one_time_services").insert([{ client_id: clientId, name, value, date, status, }])

  if (error) {
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/clients");
  
  return { success: "Serviço pontual adicionado com sucesso!" }
}


// --- Action para o NPS Interno ---
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
    return { error: "Dados inválidos. Todas as notas de 0 a 10 são obrigatórias." };
  }

  const { clientId, observations, ...categoryScores } = validatedFields.data;
  const scores = Object.values(categoryScores);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { error } = await supabaseAdmin.from("nps_responses").insert([{ client_id: clientId, score: Math.round(averageScore), category_scores: categoryScores, observations: observations, response_date: new Date().toISOString().slice(0, 10), }]);

  if (error) {
    return { error: `Ocorreu um erro ao salvar a avaliação: ${error.message}` };
  }
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: "Avaliação NPS salva com sucesso!" };
}

// --- Action para Atualizar Cliente ---
const updateClientSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  status: z.enum(["active", "inactive", "prospect"]),
});

export async function updateClient(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = updateClientSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { clientId, name, contact_email, contact_phone, status } = validatedFields.data;
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { error } = await supabaseAdmin.from("clients").update({ name, contact_email: contact_email || null, contact_phone: contact_phone || null, status, updated_at: new Date().toISOString(), }).eq("id", clientId);

  if (error) {
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/clients");

  return { success: "Cliente atualizado com sucesso!" };
}

// --- NOVA ACTION PARA ADICIONAR CONTRATO A UM CLIENTE EXISTENTE ---
const addContractSchema = z.object({
  clientId: z.string().uuid(),
  contract_name: z.string().min(3, "O nome do contrato é obrigatório."),
  valor_mensal: z.coerce.number().min(0, "O valor mensal não pode ser negativo.").optional(),
  contract_file: z.instanceof(File).refine(file => file.size > 0, "O arquivo do contrato é obrigatório."),
});

export async function addContract(formData: FormData) {
  const rawFormData = {
    clientId: formData.get('clientId'),
    contract_name: formData.get('contract_name'),
    valor_mensal: formData.get('valor_mensal'),
    contract_file: formData.get('contract_file'),
  };

  const validatedFields = addContractSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Erro de validação de contrato:", validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { clientId, contract_name, valor_mensal, contract_file } = validatedFields.data;

  // 1. Upload do arquivo
  const supabase = await createClient();
  const fileExtension = contract_file.name.split('.').pop();
  const newFileName = `${Date.now()}.${fileExtension}`;
  const filePath = `${clientId}/${newFileName}`; // Salva direto na pasta do cliente

  const { error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(filePath, contract_file);

  if (uploadError) {
    console.error("Erro no upload do contrato:", uploadError);
    return { error: `Não foi possível enviar o arquivo: ${uploadError.message}` };
  }

  // 2. Inserção no banco de dados
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { error: insertError } = await supabaseAdmin.from("contracts").insert({
    client_id: clientId,
    name: contract_name,
    valor_mensal: valor_mensal || 0,
    storage_path: filePath,
  });

  if (insertError) {
    console.error("Erro ao salvar contrato no DB:", insertError);
    // Se deu erro aqui, deleta o arquivo que já foi enviado
    await supabase.storage.from('contracts').remove([filePath]);
    return { error: `Ocorreu um erro ao salvar o contrato: ${insertError.message}` };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/clients");
  
  return { success: "Contrato adicionado com sucesso!" };
}
