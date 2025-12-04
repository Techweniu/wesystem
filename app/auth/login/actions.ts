"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string

  const adminPwd = process.env.ADMIN_PASSWORD
  const limitedPwd = process.env.LIMITED_PASSWORD

  if (!adminPwd || !limitedPwd) {
    return { error: "Erro de configuração: Senhas não definidas no servidor." }
  }

  let email = ""
  let role = ""

  // 1. Identifica qual usuário está tentando logar
  if (password === adminPwd) {
    email = "admin@wesystem.app"
    role = "admin"
  } else if (password === limitedPwd) {
    email = "limited@wesystem.app"
    role = "limited"
  } else {
    return { error: "Chave de acesso incorreta." }
  }

  // 2. Tenta fazer login no Supabase Auth (cria sessão real)
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  // 3. Se falhar (usuário não existe), cria o usuário automaticamente
  if (signInError) {
    console.log("Usuário não encontrado, criando...", email)
    const supabaseAdmin = createAdminClient()
    
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirma automaticamente
    })

    if (createError) {
      console.error("Erro ao criar usuário:", createError)
      return { error: "Erro ao gerar acesso seguro." }
    }

    // Tenta logar novamente agora que existe
    const { error: retryError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (retryError) {
      return { error: "Erro ao autenticar após criação." }
    }
  }

  // 4. Define o cookie de controle de UI (Legado/Frontend)
  cookies().set("user_role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  })

  return { success: true, role }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut() // Logout real do Supabase
  cookies().delete("user_role") // Limpa cookie de UI
  redirect("/auth/login")
}
