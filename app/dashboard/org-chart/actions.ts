"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schema simplificado apenas para o organograma
const orgPositionSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório."),
  role: z.string().min(2, "O cargo é obrigatório."),
  manager_id: z.string().uuid().optional().or(z.literal('null')),
});

export async function addOrgPosition(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    role: formData.get('role'),
    manager_id: formData.get('manager_id'),
  };
  
  // O schema Zod vai converter o campo vazio para undefined, então garantimos a presença dele
  if (!rawData.manager_id) {
    rawData.manager_id = 'null';
  }
  const validatedFields = orgPositionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { name, role, manager_id } = validatedFields.data;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { error } = await supabaseAdmin.from("org_positions").insert({
    name,
    role,
    manager_id: manager_id === 'null' ? null : manager_id,
  });

  if (error) {
    console.error("Erro do Supabase:", error);
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` };
  }

  revalidatePath("/dashboard/org-chart");
  return { success: "Posição adicionada com sucesso!" };
}

// --- NOVA ACTION PARA DELETAR POSIÇÃO ---
const deletePositionSchema = z.object({
  positionId: z.string().uuid("ID da posição inválido"),
});

export async function deleteOrgPosition(formData: FormData) {
    const rawData = { positionId: formData.get('positionId') };
    const validatedFields = deletePositionSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "ID da posição inválido." };
    }

    const { positionId } = validatedFields.data;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    // Importante: Graças à regra "ON DELETE SET NULL" que definimos no banco de dados,
    // ao deletar um gestor, todos os seus subordinados diretos terão seu campo 'manager_id'
    // definido como nulo automaticamente, tornando-se novas lideranças no organograma.
    const { error } = await supabaseAdmin
        .from("org_positions")
        .delete()
        .eq('id', positionId);

    if (error) {
        console.error("Erro ao deletar posição:", error);
        return { error: `Não foi possível remover a posição: ${error.message}` };
    }

    revalidatePath("/dashboard/org-chart");
    return { success: "Posição removida com sucesso!" };
}
