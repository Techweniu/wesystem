"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { randomUUID } from "crypto"

const addEmployeeSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório."),
  role: z.string().min(2, "O cargo é obrigatório."),
  manager_id: z.string().uuid().optional().or(z.literal('null')),
});

export async function addOrgPosition(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = addEmployeeSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { name, role, manager_id } = validatedFields.data;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const tempEmail = `${name.toLowerCase().replace(/\s/g, '.')}.${randomUUID().substring(0, 5)}@wesystem.io`;

  const { error } = await supabaseAdmin.from("employees").insert({
    name,
    role,
    manager_id: manager_id === 'null' ? null : manager_id,
    email: tempEmail,
    hire_date: new Date().toISOString(),
    status: 'active',
  });

  if (error) {
    console.error("Erro do Supabase ao criar colaborador:", error);
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` };
  }

  revalidatePath("/dashboard/org-chart");
  revalidatePath("/dashboard/team");
  return { success: "Colaborador adicionado com sucesso!" };
}

const deleteEmployeeSchema = z.object({
  positionId: z.string().uuid("ID inválido"),
});

// --- FUNÇÃO ALTERADA AQUI ---
export async function deleteOrgPosition(formData: FormData) {
    const rawData = { positionId: formData.get('positionId') };
    const validatedFields = deleteEmployeeSchema.safeParse(rawData);

    if (!validatedFields.success) { return { error: "ID inválido." }; }
    const { positionId } = validatedFields.data;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    // Em vez de '.delete()', usamos '.update()' para mudar o status para 'inactive'
    const { error } = await supabaseAdmin
        .from("employees")
        .update({ status: 'inactive' })
        .eq('id', positionId);

    if (error) {
        return { error: `Não foi possível inativar o colaborador: ${error.message}` };
    }

    revalidatePath("/dashboard/org-chart");
    revalidatePath("/dashboard/team");
    // Mensagem de sucesso atualizada
    return { success: "Colaborador inativado com sucesso!" };
}
// --- FIM DA ALTERAÇÃO ---

const updateEmployeeSchema = z.object({
    positionId: z.string().uuid(),
    name: z.string().min(3, "O nome é obrigatório."),
    role: z.string().min(2, "O cargo é obrigatório."),
    manager_id: z.string().uuid().optional().or(z.literal('null')),
});

export async function updateOrgPosition(formData: FormData) {
    const rawData = Object.fromEntries(formData);
    const validatedFields = updateEmployeeSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: "Dados inválidos." };
    }
    const { positionId, name, role, manager_id } = validatedFields.data;
    if (positionId === manager_id) {
        return { error: "Um colaborador não pode ser seu próprio gestor." };
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabaseAdmin
        .from("employees")
        .update({ name, role, manager_id: manager_id === 'null' ? null : manager_id })
        .eq('id', positionId);

    if (error) {
        return { error: `Não foi possível atualizar o colaborador: ${error.message}` };
    }

    revalidatePath("/dashboard/org-chart");
    revalidatePath("/dashboard/team");
    return { success: "Colaborador atualizado com sucesso!" };
}
