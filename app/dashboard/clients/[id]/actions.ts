"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const oneTimeServiceSchema = z.object({
  name: z.string().min(3, "O nome do serviço é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.string().min(1, "A data é obrigatória."),
  status: z.enum(["pending", "completed", "cancelled"]),
  clientId: z.string().uuid("ID do cliente inválido."),
})

export async function addOneTimeService(formData: FormData) {
  const rawFormData = {
    name: formData.get('name'),
    value: formData.get('value'),
    date: formData.get('date'),
    status: formData.get('status'),
    clientId: formData.get('clientId'),
  };

  const validatedFields = oneTimeServiceSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors);
    return { error: "Dados inválidos. Verifique as informações e tente novamente." }
  }

  const { name, value, date, status, clientId } = validatedFields.data;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { error } = await supabaseAdmin
    .from("one_time_services")
    .insert([{
      client_id: clientId,
      name,
      value,
      date,
      status,
    }])

  if (error) {
    console.error("Erro do Supabase ao adicionar serviço:", error)
    return { error: `Erro no banco de dados: ${error.message}` }
  }

  // Revalida a página específica do cliente para atualizar a lista
  revalidatePath(`/dashboard/clients/${clientId}`)

  return { success: "Serviço pontual adicionado com sucesso!" }
}
