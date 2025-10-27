"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
// REMOVIDO: import { randomUUID } from "crypto" // <-- REMOVA OU COMENTE ESTA LINHA

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

  // ====> ALTERADO: Usa Math.random() em vez de crypto.randomUUID() <====
  const randomSuffix = Math.random().toString(36).substring(2, 7); // Gera string aleatória de 5 caracteres
  const tempEmail = `${name.toLowerCase().replace(/\s+/g, '.')}.${randomSuffix}@wesystem.io`; // Usa '+' no replace para múltiplos espaços
  // ======================================================================

  const { error } = await supabaseAdmin.from("employees").insert({
    name,
    role,
    manager_id: manager_id === 'null' ? null : manager_id,
    email: tempEmail, // Usa o email temporário gerado
    hire_date: new Date().toISOString().split('T')[0], // Garante formato YYYY-MM-DD
    status: 'active',
  });

  if (error) {
    console.error("Erro do Supabase ao criar colaborador (OrgChart):", error);
    // Verifica erro de email único
    if (error.code === '23505' && error.message.includes('employees_email_key')) {
         return { error: `Ocorreu um erro: O e-mail temporário '${tempEmail}' já existe. Tente adicionar novamente.` };
    }
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
        .update({ status: 'inactive', updated_at: new Date().toISOString() }) // Adiciona updated_at
        .eq('id', positionId);

    if (error) {
        console.error("Erro Supabase ao inativar (OrgChart):", error);
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
    role: z.string().min(2, "O cargo é obrigatório."), // Manter string aqui, validação mais forte na action saveEmployee
    manager_id: z.string().uuid().optional().or(z.literal('null')),
});

export async function updateOrgPosition(formData: FormData) {
    const rawData = Object.fromEntries(formData);
    const validatedFields = updateEmployeeSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
        return { error: firstError || "Dados inválidos." };
    }
    const { positionId, name, role, manager_id } = validatedFields.data;
    if (positionId === manager_id) {
        return { error: "Um colaborador não pode ser seu próprio gestor." };
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    const dataToUpdate = {
        name,
        role,
        manager_id: manager_id === 'null' ? null : manager_id,
        updated_at: new Date().toISOString() // Adiciona updated_at
    };

    const { error } = await supabaseAdmin
        .from("employees")
        .update(dataToUpdate)
        .eq('id', positionId);

    if (error) {
         console.error("Erro Supabase ao atualizar (OrgChart):", error);
        return { error: `Não foi possível atualizar o colaborador: ${error.message}` };
    }

    revalidatePath("/dashboard/org-chart");
    revalidatePath("/dashboard/team");
     // Revalida página de detalhes do funcionário se existir
    revalidatePath(`/dashboard/team/${positionId}`);
    return { success: "Colaborador atualizado com sucesso!" };
}
