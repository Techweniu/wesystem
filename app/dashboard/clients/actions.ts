"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Schema agora inclui todos os novos campos
const clientWithContractSchema = z.object({
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  status: z.enum(["active", "inactive"]),
  cnpj: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  credit_risk: z.string().optional().or(z.literal('')),
  client_notes: z.string().optional().or(z.literal('')),
  objectives: z.string().optional().or(z.literal('')),
  contract_name: z.string().optional(),
  contract_file: z.instanceof(File).optional(),
  valor_mensal: z.coerce.number().optional(),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
})

// Esta função agora será dividida em duas: uma para o cliente, outra para o contrato
export async function addClient(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = clientWithContractSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { name, contact_email, contact_phone, status, cnpj, address, credit_risk, client_notes, objectives, contract_name, contract_file, valor_mensal, start_date, end_date } = validatedFields.data;
  
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

  // 1. Cria o cliente primeiro para obter o ID
  const { data: clientData, error: clientError } = await supabaseAdmin
    .from('clients')
    .insert({
      name, contact_email, contact_phone, status, cnpj, address, credit_risk, client_notes, objectives,
      health_status: 'green', // Padrão para novos clientes
    })
    .select('id')
    .single();

  if (clientError) {
    return { error: `Erro ao criar cliente: ${clientError.message}` };
  }
  const newClientId = clientData.id;

  // 2. Se houver dados de contrato, cria o contrato
  const hasContractData = contract_name || (valor_mensal != null && valor_mensal > 0) || (start_date);
  if (hasContractData) {
      if (!contract_name || !start_date) {
          // Se deu erro no contrato, precisamos apagar o cliente que acabamos de criar
          await supabaseAdmin.from('clients').delete().eq('id', newClientId);
          return { error: "Nome do contrato e data de início são obrigatórios ao adicionar um contrato." };
      }

      let contractPath = null;
      if (contract_file && contract_file.size > 0) {
          const supabase = await createClient();
          const fileExtension = contract_file.name.split('.').pop();
          const newFileName = `${Date.now()}.${fileExtension}`;
          const filePath = `${newClientId}/${newFileName}`; // Usa o ID do cliente recém-criado

          const { error: uploadError } = await supabase.storage.from('contracts').upload(filePath, contract_file);
          if (uploadError) { 
              await supabaseAdmin.from('clients').delete().eq('id', newClientId);
              return { error: `Não foi possível enviar o contrato: ${uploadError.message}` }; 
          }
          contractPath = filePath;
      }
      
      const { error: contractError } = await supabaseAdmin.from('contracts').insert({
          client_id: newClientId,
          name: contract_name,
          valor_mensal: valor_mensal || 0,
          start_date,
          end_date: end_date || null,
          status: 'active',
          storage_path: contractPath,
      });

      if (contractError) {
          await supabaseAdmin.from('clients').delete().eq('id', newClientId);
          if (contractPath) await createClient().then(s => s.storage.from('contracts').remove([contractPath]));
          return { error: `Erro ao salvar contrato: ${contractError.message}` };
      }
  }

  revalidatePath("/dashboard/clients");
  
  return { success: "Cliente criado com sucesso!" };
}
