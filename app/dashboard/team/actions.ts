"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Schema completo para validação dos dados do colaborador
const employeeSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().min(3, "O nome é obrigatório."),
  email: z.string().email("O e-mail é inválido."),
  role: z.string().min(2, "O cargo é obrigatório."),
  department: z.string().optional().nullable(),
  salary: z.coerce.number().min(0, "O salário não pode ser negativo.").optional().nullable(),
  hire_date: z.string().min(1, "A data de contratação é obrigatória."),
  status: z.enum(['active', 'inactive']),
  manager_id: z.string().uuid().optional().or(z.literal('null')).nullable(),
  payment_day: z.coerce.number().min(1).max(31).optional().nullable(),
});

export async function saveEmployee(formData: FormData) {
  const rawData = Object.fromEntries(formData);
  const validatedFields = employeeSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return { error: "Dados inválidos. Verifique os campos preenchidos." };
  }

  const { id, ...employeeData } = validatedFields.data;
  
  const dataToSave = {
    ...employeeData,
    manager_id: employeeData.manager_id === 'null' ? null : employeeData.manager_id,
  };

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  let error;

  if (id) {
    // Se tem ID, atualiza o colaborador existente
    const { error: updateError } = await supabaseAdmin.from("employees").update(dataToSave).eq("id", id);
    error = updateError;
  } else {
    // Se não tem ID, cria um novo
    const { error: insertError } = await supabaseAdmin.from("employees").insert(dataToSave);
    error = insertError;
  }

  if (error) {
    console.error("Erro do Supabase:", error);
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` };
  }

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/org-chart");
  return { success: `Colaborador ${id ? 'atualizado' : 'criado'} com sucesso!` };
}

// --- AÇÃO PARA MARCAR PAGAMENTO ---
const paymentSchema = z.object({
    employeeId: z.string().uuid(),
    amount: z.coerce.number().positive(),
});

export async function markPaymentAsPaid(formData: FormData) {
    const validatedFields = paymentSchema.safeParse(Object.fromEntries(formData));

    if(!validatedFields.success) {
        return { error: "Dados inválidos para registrar o pagamento." };
    }

    const { employeeId, amount } = validatedFields.data;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabaseAdmin.from("employee_payments").insert({
        employee_id: employeeId,
        amount: amount,
        payment_date: new Date().toISOString(),
    });

    if (error) {
        return { error: `Erro ao registrar pagamento: ${error.message}` };
    }

    revalidatePath("/dashboard/team");
    revalidatePath(`/dashboard/team/${employeeId}`); // Adicionado para revalidar a página de detalhes
    return { success: "Pagamento registrado com sucesso!" };
}

// --- AÇÃO PARA ADICIONAR OBSERVAÇÃO ---
const observationSchema = z.object({
    employeeId: z.string().uuid(),
    observation: z.string().min(1, "A observação não pode estar vazia."),
    tag: z.enum(['positive', 'negative']),
});

export async function addEmployeeObservation(formData: FormData) {
    const validatedFields = observationSchema.safeParse(Object.fromEntries(formData));

    if(!validatedFields.success) {
        return { error: "Dados inválidos para salvar a observação." };
    }

    const { employeeId, observation, tag } = validatedFields.data;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabaseAdmin.from("employee_observations").insert({
        employee_id: employeeId,
        observation: observation,
        tag: tag,
    });

    if (error) {
        return { error: `Erro ao salvar observação: ${error.message}` };
    }

    revalidatePath(`/dashboard/team/${employeeId}`);
    return { success: "Observação salva com sucesso!" };
}

// --- AÇÃO PARA ADICIONAR CONTRATO DO COLABORADOR ---
const addContractSchema = z.object({
  employeeId: z.string().uuid("ID do colaborador inválido."),
  contract_name: z.string().min(3, "O nome do contrato é obrigatório."),
  contract_file: z.instanceof(File).refine(file => file.size > 0, "O arquivo do contrato é obrigatório."),
});

export async function addEmployeeContract(formData: FormData) {
  const rawFormData = {
    employeeId: formData.get('employeeId'),
    contract_name: formData.get('contract_name'),
    contract_file: formData.get('contract_file'),
  };
  
  const validatedFields = addContractSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Dados inválidos." };
  }

  const { employeeId, contract_name, contract_file } = validatedFields.data;

  // Upload do arquivo para o Supabase Storage
  let contractPath = null;
  const supabase = await createClient(); // Usa o client normal para upload
  const fileExtension = contract_file.name.split('.').pop();
  const newFileName = `${Date.now()}.${fileExtension}`;
  const filePath = `${employeeId}/${newFileName}`;

  const { error: uploadError } = await supabase.storage
    .from('employee_contracts') // Nome do novo bucket
    .upload(filePath, contract_file);

  if (uploadError) {
    return { error: `Não foi possível enviar o arquivo: ${uploadError.message}` };
  }
  contractPath = filePath;

  // Inserção dos dados na nova tabela
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { error: insertError } = await supabaseAdmin.from("employee_contracts").insert({
    employee_id: employeeId,
    name: contract_name,
    storage_path: contractPath,
  });

  if (insertError) {
    // Se der erro ao salvar no banco, remove o arquivo que já foi enviado
    await supabase.storage.from('employee_contracts').remove([contractPath]);
    return { error: `Ocorreu um erro ao salvar o contrato: ${insertError.message}` };
  }

  revalidatePath(`/dashboard/team/${employeeId}`);
  return { success: "Contrato adicionado com sucesso!" };
}

// --- AÇÃO PARA ADICIONAR CONTRIBUIÇÃO DO COLABORADOR ---
const contributionSchema = z.object({
  employeeId: z.string().uuid(),
  description: z.string().min(3, "A descrição é obrigatória."),
  category: z.enum(['Venda', 'Upsell', 'Ideia', 'Melhoria de Processo', 'Outro']),
  value: z.coerce.number().min(0, "O valor não pode ser negativo.").optional().nullable(),
  date: z.string().min(1, "A data é obrigatória."),
});

export async function addEmployeeContribution(formData: FormData) {
    const rawData = Object.fromEntries(formData);
    const validatedFields = contributionSchema.safeParse(rawData);

    if(!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
        return { error: firstError || "Dados inválidos." };
    }

    const { employeeId, ...contributionData } = validatedFields.data;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabaseAdmin.from("employee_contributions").insert({
        employee_id: employeeId,
        description: contributionData.description,
        category: contributionData.category,
        value: contributionData.value,
        date: contributionData.date,
    });

    if (error) {
        return { error: `Erro ao salvar contribuição: ${error.message}` };
    }

    revalidatePath(`/dashboard/team/${employeeId}`);
    return { success: "Contribuição registrada com sucesso!" };
}
