"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// --- Action para Serviço Pontual ---
const oneTimeServiceSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  name: z.string().min(1, "O nome do serviço é obrigatório."),
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

// --- Action para Atualizar Informações Gerais do Cliente ---
const updateClientSchema = z.object({
  clientId: z.string().uuid("ID do cliente inválido."),
  name: z.string().min(3, "O nome do cliente é obrigatório.").optional(),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  status: z.enum(["active", "inactive"]).optional(),
  health_status: z.enum(["green", "yellow", "red"]).optional(),
  cnpj: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  credit_risk: z.string().optional().or(z.literal('')),
});

export async function updateClient(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = updateClientSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { clientId, ...updateData } = validatedFields.data;
  
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  
  const { error } = await supabaseAdmin
    .from("clients")
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) {
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/clients");

  return { success: "Cliente atualizado com sucesso!" };
}


// --- Action para Atualizar Notas e Objetivos do Cliente ---
const updateClientNotesSchema = z.object({
  clientId: z.string().uuid(),
  client_notes: z.string().optional().or(z.literal('')),
  objectives: z.string().optional().or(z.literal('')),
});

export async function updateClientNotes(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = updateClientNotesSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Dados inválidos para atualizar as notas." };
    }

    const { clientId, client_notes, objectives } = validatedFields.data;
    
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

    const { error } = await supabaseAdmin
        .from("clients")
        .update({
            client_notes: client_notes || null,
            objectives: objectives || null,
        })
        .eq('id', clientId);
    
    if (error) {
        return { error: `Erro ao salvar notas: ${error.message}` };
    }

    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: "Notas e objetivos atualizados!" };
}


// --- Action para Adicionar Contrato ---
const addContractSchema = z.object({
  clientId: z.string().uuid(),
  contract_name: z.string().min(3, "O nome do contrato é obrigatório."),
  valor_mensal: z.coerce.number().min(0, "O valor mensal não pode ser negativo.").optional(),
  start_date: z.string().min(1, "A data de início é obrigatória."),
  end_date: z.string().optional().or(z.literal('')),
  contract_file: z.instanceof(File).optional(),
});

export async function addContract(formData: FormData) {
  const rawFormData = {
    clientId: formData.get('clientId'),
    contract_name: formData.get('contract_name'),
    valor_mensal: formData.get('valor_mensal'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    contract_file: formData.get('contract_file'),
  };

  const validatedFields = addContractSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { clientId, contract_name, valor_mensal, start_date, end_date, contract_file } = validatedFields.data;

  let contractPath = null;
  if (contract_file && contract_file.size > 0) {
      const supabase = await createClient();
      const fileExtension = contract_file.name.split('.').pop();
      const newFileName = `${Date.now()}.${fileExtension}`;
      const filePath = `${clientId}/${newFileName}`;

      const { error: uploadError } = await supabase.storage.from('contracts').upload(filePath, contract_file);
      if (uploadError) { return { error: `Não foi possível enviar o arquivo: ${uploadError.message}` }; }
      contractPath = filePath;
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  
  const { error: insertError } = await supabaseAdmin.from("contracts").insert({ 
    client_id: clientId, 
    name: contract_name, 
    valor_mensal: valor_mensal || 0, 
    storage_path: contractPath,
    start_date: start_date,
    end_date: end_date || null,
    status: 'active',
  });

  if (insertError) {
    if (contractPath) { await createClient().then(s => s.storage.from('contracts').remove([contractPath!])); }
    return { error: `Ocorreu um erro ao salvar o contrato: ${insertError.message}` };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/clients");
  
  return { success: "Contrato adicionado com sucesso!" };
}


// --- Action para Atualizar Status do Serviço ---
const updateServiceStatusSchema = z.object({
  serviceId: z.string().uuid(),
  clientId: z.string().uuid(),
  status: z.enum(["pending", "completed", "cancelled"]),
});

export async function updateServiceStatus(data: { serviceId: string, clientId: string, status: "pending" | "completed" | "cancelled" }) {
  const validatedFields = updateServiceStatusSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: "Dados inválidos para atualizar o status." };
  }

  const { serviceId, clientId, status } = validatedFields.data;
  
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  const { error } = await supabaseAdmin.from("one_time_services").update({ status: status }).eq('id', serviceId);

  if (error) {
    return { error: `Não foi possível atualizar o status: ${error.message}` };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/clients");
  
  return { success: "Status do serviço atualizado com sucesso!" };
}

// --- Action para Atualizar Contrato ---
const updateContractSchema = z.object({
    contractId: z.string().uuid(),
    name: z.string().min(3, "O nome do contrato é obrigatório."),
    valor_mensal: z.coerce.number().min(0).optional(),
    start_date: z.string().min(1, "A data de início é obrigatória."),
    end_date: z.string().optional().or(z.literal('')),
    status: z.enum(['active', 'inactive']),
});

export async function updateContract(formData: FormData) {
    const rawData = Object.fromEntries(formData);
    const validatedFields = updateContractSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
        return { error: firstError || "Dados inválidos." };
    }

    const { contractId, name, valor_mensal, start_date, end_date, status } = validatedFields.data;

    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

    const { data: contract, error: fetchError } = await supabaseAdmin.from('contracts').select('client_id').eq('id', contractId).single();

    if (fetchError) {
        return { error: "Contrato não encontrado." };
    }

    const { error: updateError } = await supabaseAdmin
        .from('contracts')
        .update({
            name,
            valor_mensal: valor_mensal || 0,
            start_date,
            end_date: end_date || null,
            status,
        })
        .eq('id', contractId);

    if (updateError) {
        return { error: `Não foi possível atualizar o contrato: ${updateError.message}` };
    }

    revalidatePath(`/dashboard/clients/${contract.client_id}`);
    revalidatePath('/dashboard/clients');

    return { success: "Contrato atualizado com sucesso!" };
}

// --- ACTIONS PARA GERENCIAR CONTATOS ---
const contactSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório."),
  role: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
  birth_date: z.string().optional().or(z.literal('')),
});

// Action para Adicionar um novo Contato
export async function addClientContact(formData: FormData) {
  const clientId = formData.get('clientId') as string;
  const validatedFields = contactSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success || !clientId) {
    return { error: "Dados inválidos." };
  }
  
  const { name, role, email, phone, birth_date } = validatedFields.data;
  
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { error } = await supabaseAdmin.from('client_contacts').insert({ client_id: clientId, name, role, email, phone, birth_date: birth_date || null });

  if (error) { return { error: `Erro ao salvar contato: ${error.message}` }; }
  
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: "Contato adicionado com sucesso." };
}

// Action para Editar um Contato existente
export async function updateClientContact(formData: FormData) {
    const contactId = formData.get('contactId') as string;
    const clientId = formData.get('clientId') as string;
    const validatedFields = contactSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success || !contactId || !clientId) {
        return { error: "Dados inválidos." };
    }

    const { name, role, email, phone, birth_date } = validatedFields.data;

    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { error } = await supabaseAdmin.from('client_contacts').update({ name, role, email, phone, birth_date: birth_date || null }).eq('id', contactId);
    
    if (error) { return { error: `Erro ao atualizar contato: ${error.message}` }; }

    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: "Contato atualizado com sucesso." };
}

// Action para Deletar um Contato
export async function deleteClientContact(formData: FormData) {
    const contactId = formData.get('contactId') as string;
    const clientId = formData.get('clientId') as string;

    if (!contactId || !clientId) { return { error: "IDs inválidos." } };

    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { error } = await supabaseAdmin.from('client_contacts').delete().eq('id', contactId);

    if (error) { return { error: `Erro ao deletar contato: ${error.message}` }; }

    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: "Contato removido com sucesso." };
}
