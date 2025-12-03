"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { loginAction } from "./actions" // Importa a ação segura

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    
    // Chama a Server Action (nada de senha no cliente!)
    const result = await loginAction(formData)

    if (result.error) {
      toast.error(result.error)
      setIsLoading(false)
    } else {
      // Sucesso!
      // Ainda gravamos no localStorage APENAS para controle de UI (esconder menus),
      // mas a segurança real agora está no Cookie HttpOnly que o servidor criou.
      if (result.role) {
        localStorage.setItem("userRole", result.role)
      }

      if (result.role === "admin") {
        toast.success("Login (Diretoria) realizado com sucesso!")
        router.push("/dashboard")
      } else {
        toast.success("Login realizado com sucesso!")
        router.push("/dashboard/accesses")
      }
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Wesystem</h1>
          <p className="mt-2 text-sm text-muted-foreground">Business Intelligence para sua agência</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
            <CardDescription>Digite a chave de acesso para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Usamos a action diretamente no form para progressão progressiva, 
                mas controlamos o submit para feedback visual (loading) */}
            <form action={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">Chave de Acesso</Label>
                  <Input
                    id="password"
                    name="password" // Necessário para o FormData
                    type="password"
                    placeholder="Digite sua chave..."
                    required
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
