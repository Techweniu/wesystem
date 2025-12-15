"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"

// Definição dos tipos de usuários permitidos via variáveis de ambiente
interface AuthConfig {
  envKey: string
  email: string
  role: string
  name: string // Adicionado para identificar quem aprovou
}

const AUTH_CONFIGS: AuthConfig[] = [
  // Acesso original
  { envKey: "ADMIN_PASSWORD", email: "admin@wesystem.app", role: "admin", name: "Administrador" },
  
  // Novos acessos da Diretoria (@weniu.com)
  { envKey: "PAULO_PASSWORD", email: "paulo@weniu.com", role: "admin", name: "Paulo" },
  { envKey: "ATILA_PASSWORD", email: "atila@weniu.com", role: "admin", name: "Atila" },
  { envKey: "VINICIUS_PASSWORD", email: "vinicius@weniu.com", role: "admin", name: "Vinicius" },
  { envKey: "ISADORA_PASSWORD", email: "isadora@weniu.com", role: "admin", name: "Isadora" },
  { envKey: "JOAO_PASSWORD", email: "joao@weniu.com", role: "admin", name: "Joao" },
]

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string
  const limitedPwd = process.env.LIMITED_PASSWORD

  let email = ""
  let role = ""
  let name = ""

  // 1. Verificar se a senha corresponde a algum administrador configurado
  const matchedAdmin = AUTH_CONFIGS.find(config => {
    const envPassword = process.env[config.envKey]
    return envPassword && envPassword === password
  })

  if (matchedAdmin) {
    email = matchedAdmin.email
    role = matchedAdmin.role
    name = matchedAdmin.name
  } 
  // 2. Verificar acesso limitado (legado)
  else if (limitedPwd && password === limitedPwd) {
    email = "limited@wesystem.app"
    role = "limited"
    name = "Visualizador"
  } 
  // 3. Senha incorreta
  else {
    return { error: "Chave de acesso incorreta." }
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // Tentativa de login normal
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Se falhar (usuário não existe ou senha mudou), usamos o Admin Client para corrigir
  if (signInError) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.find((u) => u.email === email)

    if (userExists) {
      // Atualiza a senha do usuário existente para bater com a do .env
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userExists.id, { password })

      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError)
        return { error: "Erro ao sincronizar acesso." }
      }
    } else {
      // Cria o usuário automaticamente se ele não existir (Auto-Provisioning)
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createError) {
        console.error("Erro ao criar usuário:", createError)
        return { error: "Erro ao gerar acesso seguro." }
      }
    }

    // Tenta logar novamente após a correção/criação
    const { error: retryError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (retryError) {
      console.error("Erro no retry:", retryError)
      return { error: "Erro ao autenticar. Tente novamente." }
    }
  }

  // Define os cookies de sessão da aplicação
  const cookieStore = await cookies()
  
  // Cookie de Role (já existia)
  cookieStore.set("user_role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  })

  // NOVO: Cookie de Nome (para auditoria de aprovação)
  cookieStore.set("user_name", name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  })

  return { success: true, role }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete("user_role")
  cookieStore.delete("user_name")
  redirect("/auth/login")
}
