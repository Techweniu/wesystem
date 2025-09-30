"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Definimos um "esquema" para validar os dados que vêm do formulário.
// Isso garante que ninguém vai injetar dados maliciosos.
const clientSchema = z.object({
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect"]),
})

export async function addClient(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries())

  // Validamos os dados usando o esquema Zod
  const validatedFields = clientSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
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
    console.error("Erro do Supabase:", error)
    return {
      error: "Ocorreu um erro ao adicionar o cliente.",
    }
  }

  // Avisa ao Next.js para recarregar os dados da página de clientes
  revalidatePath("/dashboard/clients")
  
  return {
    success: "Cliente adicionado com sucesso!",
  }
}
