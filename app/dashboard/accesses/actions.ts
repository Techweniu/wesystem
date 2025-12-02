"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema de validação para os dados do formulário
const accessSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')), 
  platform_name: z.string().min(1, "O nome da plataforma é obrigatório."),
  username: z.string().optional().nullable(),
  password_info: z.string().optional().nullable(),
  // O departamento pode vir preenchido ou ser inferido
  department: z.enum(['Diretoria', 'Tecnologia', 'Produção', 'Marketing', 'Cliente', 'Geral']).optional(),
  client_name: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(), // NOVO CAMPO
  notes: z.string().optional().nullable(),
});

// Ação para ADICIONAR ou EDITAR um acesso
export async function saveAccess(formData: FormData) {
  const rawData = Object.fromEntries(formData);

  // Se veio um client_id, forçamos o departamento para 'Cliente'
  if (rawData.client_id && rawData.client_id !== "null") {
      rawData.department = "Cliente";
  }
  // Se o departamento não foi enviado e não é cliente específico, define como 'Geral'
  else if (!rawData.department || rawData.department === "") {
      rawData.department = "Geral";
  }

  const validatedFields = accessSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos. Verifique os campos." };
  }

  const { id, ...accessData } = validatedFields.data;

  // Ajusta os dados finais
  const dataToSave = {
    ...accessData,
    // Se for Geral, grava null no banco (se seu DB usa null para Geral), senão grava a string
    department: accessData.department === "Geral" ? null : accessData.department,
    // Se tiver client_id, garante que client_name também seja salvo (opcional, mas bom para visualização rápida)
    // Se não for departamento Cliente, limpa os dados de cliente
    client_name: accessData.department === "Cliente" ? accessData.client_name : null, 
    client_id: accessData.department === "Cliente" ? accessData.client_id : null,
  };

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  let error;
  let successMessage = "";

  if (id) {
    // Atualizar
     const { error: updateError } = await supabaseAdmin
       .from("platform_access")
       .update(dataToSave)
       .eq("id", id);
     error = updateError;
     successMessage = "Acesso atualizado com sucesso!";
  } else {
    // Inserir novo acesso
    const { error: insertError } = await supabaseAdmin.from("platform_access").insert(dataToSave);
    error = insertError;
    successMessage = "Acesso adicionado com sucesso!";
  }

  if (error) {
    console.error("Erro do Supabase:", error);
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` };
  }

  revalidatePath("/dashboard/accesses");
  // Se tiver client_id, revalida a página específica do cliente também
  if (dataToSave.client_id) {
      revalidatePath(`/dashboard/clients/${dataToSave.client_id}`);
  }
  
  return { success: successMessage };
}


// Ação para EXCLUIR um acesso
const deleteAccessSchema = z.object({
    accessId: z.string().uuid("ID inválido."),
});

export async function deleteAccess(formData: FormData) {
    const rawData = { accessId: formData.get('accessId') };
    const validatedFields = deleteAccessSchema.safeParse(rawData);

    if(!validatedFields.success) {
        return { error: "ID inválido para exclusão." };
    }
    const { accessId } = validatedFields.data;

     const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    // Primeiro buscamos o acesso para saber se precisamos revalidar alguma página de cliente
    const { data: accessToDelete } = await supabaseAdmin
        .from("platform_access")
        .select("client_id")
        .eq("id", accessId)
        .single();

    const { error } = await supabaseAdmin
        .from("platform_access")
        .delete()
        .eq('id', accessId);

    if (error) {
        console.error("Erro Supabase ao deletar:", error);
        return { error: `Não foi possível excluir o acesso: ${error.message}` };
    }

    revalidatePath("/dashboard/accesses");
    if (accessToDelete?.client_id) {
        revalidatePath(`/dashboard/clients/${accessToDelete.client_id}`);
    }
    
    return { success: "Acesso excluído com sucesso!" };
}
