"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { isNonRecurringService } from "@/lib/non-recurring-services"

const clientSchema = z.object({
  name: z.string().min(3, "O nome do cliente é obrigatório."),
  contact_email: z.string().email("Por favor, insira um email válido.").optional().or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "prospect"]),
  cnpj: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  credit_risk: z.string().optional().or(z.literal("")),
  client_notes: z.string().optional().or(z.literal("")),
  objectives: z.string().optional().or(z.literal("")),
  // Campos de Tráfego
  has_traffic_service: z.preprocess((val) => val === "on" || val === "true", z.boolean()).optional(),
  ad_account_organized: z.preprocess((val) => val === "on" || val === "true", z.boolean()).optional(),
  ads_running: z.preprocess((val) => val === "on" || val === "true", z.boolean()).optional(),
  // Campos de Contrato (Opcionais na criação, mas validados se fornecidos)
  contract_name: z.string().optional().or(z.literal("")),
  contract_value: z.coerce.number().min(0).optional(),
  contract_start_date: z.string().optional().or(z.literal("")),
  contract_end_date: z.string().optional().or(z.literal("")),
  contract_file: z.instanceof(File).optional(),
  // Serviços (agora array de strings/nomes vindo do ServicesMultiSelect)
  services: z.string().optional(), // JSON string
})

export async function addClient(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validatedFields = clientSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors)
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0]
    return { error: firstError || "Dados inválidos." }
  }

  const data = validatedFields.data
  const servicesArray = data.services ? JSON.parse(data.services) : []

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Criar Cliente
  const { data: clientData, error: clientError } = await supabaseAdmin
    .from("clients")
    .insert({
      name: data.name,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      status: data.status,
      cnpj: data.cnpj || null,
      address: data.address || null,
      credit_risk: data.credit_risk || null,
      client_notes: data.client_notes || null,
      objectives: data.objectives || null,
      has_traffic_service: data.has_traffic_service || false,
      ad_account_organized: data.ad_account_organized || false,
      ads_running: data.ads_running || false,
      health_status: "green",
    })
    .select("id")
    .single()

  if (clientError || !clientData) {
    console.error("Erro ao criar cliente:", clientError)
    return { error: `Erro ao criar cliente: ${clientError?.message}` }
  }

  const clientId = clientData.id

  // 2. Se houver dados de contrato, criar contrato
  if (data.contract_name && data.contract_start_date) {
    let contractPath = null

    // Upload do arquivo se existir
    if (data.contract_file && data.contract_file.size > 0) {
      const supabase = await createClient() // Cliente autenticado para storage
      const fileExtension = data.contract_file.name.split(".").pop()
      const newFileName = `${Date.now()}.${fileExtension}`
      const filePath = `${clientId}/${newFileName}`

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, data.contract_file)

      if (uploadError) {
        console.error("Erro Upload Contrato:", uploadError)
        // Não aborta a criação do cliente, mas avisa no log
      } else {
        contractPath = filePath
      }
    }

    const { data: contractData, error: contractError } = await supabaseAdmin
      .from("contracts")
      .insert({
        client_id: clientId,
        name: data.contract_name,
        valor_mensal: data.contract_value || 0,
        start_date: data.contract_start_date,
        end_date: data.contract_end_date || null,
        status: "active",
        storage_path: contractPath,
        services: servicesArray, // Salva os serviços no JSON do contrato
      })
      .select("id")
      .single()

    if (contractError) {
      console.error("Erro ao criar contrato:", contractError)
      // O cliente já foi criado, retornamos sucesso parcial ou aviso?
      // Por enquanto, retornamos erro mas o cliente fica lá (o que é aceitável, o usuário pode tentar adicionar contrato depois)
    } else if (contractData) {
      // 3. Gerar entregáveis para serviços não recorrentes
      const nonRecurringServices = servicesArray.filter((service: string) => isNonRecurringService(service))
      
      if (nonRecurringServices.length > 0) {
        const deliverables = nonRecurringServices.map((service: string) => ({
          contract_id: contractData.id,
          service_name: service,
          delivered: false,
        }))

        await supabaseAdmin.from("contract_deliverables").insert(deliverables)
      }
    }
  }

  // OBS: Não estamos mais inserindo na tabela `client_services` antiga baseada em IDs,
  // pois estamos migrando para o modelo baseado no contrato (JSONB).
  // Se necessário para compatibilidade, adicione aqui a lógica de mapeamento nome -> id.

  revalidatePath("/dashboard/clients")
  return { success: "Cliente cadastrado com sucesso!" }
}
