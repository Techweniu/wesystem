"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "crypto"; // <-- LINHA REINSERIDA

// Schema de validação para os dados do formulário
const accessSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')), // Para edição futura
  platform_name: z.string().min(1, "O nome da plataforma é obrigatório."),
  username: z.string().optional().nullable(),
  password_info: z.string().optional().nullable(),
  // CORREÇÃO: Removido .nullable() daqui, pois 'Geral' é o valor para nulo/vazio
  department: z.enum(['Diretoria', 'Tecnologia', 'Produção', 'Marketing', 'Cliente', 'Geral']),
  client_name: z.string().optional().nullable(), // Adicionado
  notes: z.string().optional().nullable(),
});

// Ação para ADICIONAR ou EDITAR um acesso
export async function saveAccess(formData: FormData) {
  const rawData = Object.fromEntries(formData);

  // Se o departamento não foi enviado (ou veio vazio), define como 'Geral' antes de validar
  if (!rawData.department || rawData.department === "") {
      rawData.department = "Geral";
  }


  const validatedFields = accessSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos. Verifique os campos." };
  }

  const { id, ...accessData } = validatedFields.data;

  // Ajusta o departamento para null se 'Geral' for selecionado antes de salvar no DB
  // Limpa client_name se o departamento não for 'Cliente'
  const dataToSave = {
    ...accessData,
    department: accessData.department === "Geral" ? null : accessData.department,
    client_name: accessData.department === "Cliente" ? (accessData.client_name === "" ? null : accessData.client_name) : null, // Limpa se não for Cliente
  };


  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  let error;
  let successMessage = "";

  if (id) {
    // Atualizar (implementação futura)
     const { error: updateError } = await supabaseAdmin
       .from("platform_access")
       .update(dataToSave)
       .eq("id", id);
     error = updateError;
     successMessage = "Acesso atualizado com sucesso!";
    // return { error: "Funcionalidade de edição ainda não implementada." }; // Placeholder
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

  revalidatePath("/dashboard/accesses"); // Atualiza a página de acessos
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

    const { error } = await supabaseAdmin
        .from("platform_access")
        .delete()
        .eq('id', accessId);

    if (error) {
        console.error("Erro Supabase ao deletar:", error);
        return { error: `Não foi possível excluir o acesso: ${error.message}` };
    }

    revalidatePath("/dashboard/accesses");
    return { success: "Acesso excluído com sucesso!" };
}
