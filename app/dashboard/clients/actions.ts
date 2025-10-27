// Caminho: wesystem7/app/dashboard/clients/actions.ts
"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
// Removido import createClient from server, pois não é mais usado para upload aqui

// Schema agora inclui service_ids como um array opcional de strings (UUIDs)
const clientSchema = z.object({
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  status: z.enum(["active", "inactive", "prospect"]), // 'prospect' adicionado
  cnpj: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  credit_risk: z.string().optional().or(z.literal('')),
  client_notes: z.string().optional().or(z.literal('')),
  objectives: z.string().optional().or(z.literal('')),
  // Este campo é o que vem do FormData (por causa do getAll), mas será renomeado para 'service_ids'
  'service_ids[]': z.preprocess(
      (val) => (Array.isArray(val) ? val : val ? [val] : []), // Garante que seja um array, ou vazio se não houver
      z.array(z.string().uuid("ID de serviço inválido.")).optional()
  ),
});

export async function addClient(formData: FormData) {
  // Coleta dados crus e o array de service_ids[]
  const rawData = Object.fromEntries(formData.entries());
  const serviceIdsArray = formData.getAll('service_ids[]').filter(id => id); // Filtra strings vazias

  // Monta o objeto para validação
  const dataToValidate = {
      ...rawData,
      'service_ids[]': serviceIdsArray,
  };

  const validatedFields = clientSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  // Renomeia 'service_ids[]' para service_ids para clareza e remove do objeto principal
  const { 'service_ids[]': service_ids, ...clientInsertData } = validatedFields.data;

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  // 1. Cria o cliente primeiro para obter o ID
  const { data: clientData, error: clientError } = await supabaseAdmin
    .from('clients')
    .insert({
      ...clientInsertData,
      health_status: 'green', // Padrão para novos clientes
    })
    .select('id')
    .single();

  if (clientError) {
    console.error("Supabase client insert error:", clientError);
    return { error: `Erro ao criar cliente: ${clientError.message}` };
  }
  const newClientId = clientData.id;

  // 2. Se houver serviços selecionados, insere na tabela 'client_services'
  if (service_ids && service_ids.length > 0) {
      const clientServicesData = service_ids.map(serviceId => ({
          client_id: newClientId,
          service_id: serviceId,
          is_done: false, // Padrão inicial
      }));

      const { error: servicesError } = await supabaseAdmin
          .from('client_services')
          .insert(clientServicesData);

      if (servicesError) {
          console.error("Supabase client_services insert error:", servicesError);
          // Se deu erro ao inserir serviços, precisamos apagar o cliente que acabamos de criar
          await supabaseAdmin.from('clients').delete().eq('id', newClientId);
          return { error: `Erro ao associar serviços ao cliente: ${servicesError.message}` };
      }
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${newClientId}`); // Revalida a página de detalhes tbm

  return { success: "Cliente criado com sucesso!" };
}
