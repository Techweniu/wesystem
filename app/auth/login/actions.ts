"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string

  // Busca as senhas seguras das variáveis de ambiente
  const adminPwd = process.env.ADMIN_PASSWORD
  const limitedPwd = process.env.LIMITED_PASSWORD

  if (!adminPwd || !limitedPwd) {
    return { error: "Erro de configuração do servidor: Senhas não definidas." }
  }

  // Verifica ADMIN
  if (password === adminPwd) {
    // Cria um cookie seguro (HttpOnly) que dura 7 dias
    cookies().set("user_role", "admin", {
      httpOnly: true, // JavaScript não consegue ler (protege contra XSS)
      secure: process.env.NODE_ENV === "production", // Só via HTTPS em produção
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    })
    return { success: true, role: "admin" }
  }

  // Verifica LIMITADO
  if (password === limitedPwd) {
    cookies().set("user_role", "limited", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    return { success: true, role: "limited" }
  }

  return { error: "Chave de acesso incorreta." }
}

export async function logoutAction() {
  cookies().delete("user_role")
  redirect("/auth/login")
}
