"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const clientWithContractSchema = z.object({
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  status: z.enum(["active", "inactive", "prospect"]),
  contract_name: z.string().optional(),
  contract_file: z.instanceof(File).optional(),
  valor_mensal: z.coerce.number().optional(), // Novo campo
})

export async function addClient(formData: FormData) {
  const rawFormData = {
    name: formData.get('name'),
    contact_email: formData.get('contact_email'),
    contact_phone: formData.get('contact_phone'),
    status: formData.get('status'),
    contract_name: formData.get('contract_name'),
    contract_file: formData.get('contract_file'),
    valor_mensal: formData.get('valor_mensal'), // Novo campo
  };

  const validatedFields = clientWithContractSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors)
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." }
  }

  const { name, contact_email, contact_phone, status, contract_name, contract_file, valor_mensal } = validatedFields.data;

  let contractPath = null;
  if (contract_file && contract_file.size > 0) {
    if (!contract_name || contract_name.trim() === '') {
      return { error: "O nome do contrato é obrigatório ao enviar um arquivo." };
    }

    const supabase = await createClient();
    const fileExtension = contract_file.name.split('.').pop();
    const newFileName = `${Date.now()}.${fileExtension}`;
    const filePath = `public/${newFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, contract_file);

    if (uploadError) {
      console.error("Erro no upload do Supabase:", uploadError);
      return { error: `Não foi possível enviar o contrato: ${uploadError.message}` };
    }
    
    contractPath = filePath;
  }
  
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: newClientId, error: rpcError } = await supabaseAdmin.rpc('create_client_with_optional_contract', {
    client_name: name,
    client_email: contact_email || null,
    client_phone: contact_phone || null,
    client_status: status,
    contract_name: contract_name || null,
    contract_path: contractPath,
    contract_value: valor_mensal || 0, // Novo campo
  });

  if (rpcError) {
    console.error("Erro do Supabase RPC:", rpcError);
    if (contractPath) {
      const supabase = await createClient();
      await supabase.storage.from('contracts').remove([contractPath]);
    }
    return { error: `Ocorreu um erro no banco de dados: ${rpcError.message}` };
  }
  
  if (contractPath && newClientId) {
     const supabase = await createClient();
     const newPath = `${newClientId}/${contractPath.split('/')[1]}`;
     const { error: moveError } = await supabase.storage
       .from('contracts')
       .move(contractPath, newPath);

     if (moveError) {
       console.error('Erro ao mover o arquivo:', moveError);
     } else {
        await supabaseAdmin.from('contracts').update({ storage_path: newPath }).match({ storage_path: contractPath });
     }
  }

  revalidatePath("/dashboard/clients");
  
  return { success: "Cliente criado com sucesso!" };
}
