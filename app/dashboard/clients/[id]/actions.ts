"use server"

// A MUDANÇA CRUCIAL ESTÁ AQUI: Importamos de '@supabase/supabase-js'
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// O esquema de validação permanece o mesmo
const clientSchema = z.object({
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect"]),
})

export async function addClient(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())

  const validatedFields = clientSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    console.error("Erro de validação:", validatedFields.error.flatten().fieldErrors)
    return { error: "Dados inválidos." }
  }

  // Agora criamos o cliente admin dedicado, como planejado
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert([
      {
        name: validatedFields.data.name,
        contact_email: validatedFields.data.contact_email,
        contact_phone: validatedFields.data.contact_phone,
        status: validatedFields.data.status,
      },
    ])
  
  if (error) {
    console.error("Erro do Supabase ao adicionar cliente:", error)
    return { error: `Ocorreu um erro no banco de dados: ${error.message}` }
  }

  revalidatePath("/dashboard/clients")
  
  return { success: "Cliente adicionado com sucesso!" }
}
