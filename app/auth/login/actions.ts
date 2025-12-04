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

  if (password === adminPwd) {
    email = "admin@wesystem.app"
    role = "admin"
  } else if (password === limitedPwd) {
    email = "limited@wesystem.app"
    role = "limited"
  } else {
    return { error: "Chave de acesso incorreta." }
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.find((u) => u.email === email)

    if (userExists) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userExists.id, { password })

      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError)
        return { error: "Erro ao sincronizar acesso." }
      }
    } else {
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

    const { error: retryError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (retryError) {
      console.error("Erro no retry:", retryError)
      return { error: "Erro ao autenticar. Tente novamente." }
    }
  }

  const cookieStore = await cookies()
  cookieStore.set("user_role", role, {
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
  redirect("/auth/login")
}
