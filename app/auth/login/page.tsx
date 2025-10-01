"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

// A senha mestra. Em um mundo ideal, isso estaria em uma variável de ambiente.
const MASTER_PASSWORD = "491hrinh19283"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login attempt started")
    setIsLoading(true)

    if (password === MASTER_PASSWORD) {
      console.log("[v0] Password correct, setting localStorage")
      localStorage.setItem("isAuthenticated", "true")

      // Verificar se foi setado corretamente
      const authCheck = localStorage.getItem("isAuthenticated")
      console.log("[v0] localStorage check:", authCheck)

      toast.success("Login realizado com sucesso!")

      setTimeout(() => {
        console.log("[v0] Redirecting to dashboard")
        router.push("/dashboard")

        setTimeout(() => {
          console.log("[v0] Using window.location fallback")
          window.location.href = "/dashboard"
        }, 500)
      }, 100)
    } else {
      console.log("[v0] Password incorrect")
      toast.error("Senha incorreta. Tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">BI Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Business Intelligence para sua agência</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
            <CardDescription>Digite a senha para acessar o dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
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
