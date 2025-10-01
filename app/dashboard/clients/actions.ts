"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const clientWithContractSchema = z.object({
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  status: z.enum(["active", "inactive", "prospect"]),
  monthly_value: z.coerce.number().optional(),
  start_date: z.string().optional().or(z.literal('')), // Permite string vazia
  end_date: z.string().optional().or(z.literal('')),   // Permite string vazia
})

export async function addClient(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())
  
  const validatedFields = clientWithContractSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors)
    return { error: "Dados inválidos." }
  }
  
  const { name, contact_email, contact_phone, status, monthly_value, start_date, end_date } = validatedFields.data;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { error } = await supabaseAdmin.rpc('create_client_with_contract', {
    client_name: name,
    client_email: contact_email || null,
    client_phone: contact_phone || null,
    client_status: status,
    contract_value: monthly_value || null,
    contract_start_date: start_date || null,
    contract_end_date: end_date || null, // Enviando a nova data
  })

  if (error) {
    console.error("Erro do Supabase RPC:", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  revalidatePath("/dashboard/clients")
  
  return { success: "Cliente criado com sucesso!" }
}
