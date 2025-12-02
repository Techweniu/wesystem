'use client'

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

// --- ALTERAÇÃO AQUI: Novas senhas definidas ---
const MASTER_PASSWORD = "uinew"
const LIMITED_PASSWORD = "weniu"
// ----------------------------------------------

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Verifica a senha e define o "userRole" correspondente
    if (password === MASTER_PASSWORD) {
      localStorage.setItem("userRole", "admin") // Papel de Admin (Diretor)
      toast.success("Login (Diretoria) realizado com sucesso!")
      router.push("/dashboard")
    } else if (password === LIMITED_PASSWORD) {
      localStorage.setItem("userRole", "limited") // Papel Limitado (Restante)
      toast.success("Login realizado com sucesso!")
      router.push("/dashboard")
    } else {
      toast.error("Chave de acesso incorreta.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* Logo ou Título */}
          <h1 className="text-3xl font-bold tracking-tight">Wesystem</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acesso restrito ao sistema</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Digite sua chave de acesso para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">Chave de Acesso</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite a chave..."
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verificando..." : "Entrar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
