"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { loginAction } from "./actions"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    
    try {
      const result = await loginAction(formData)

      // Verificação de erro robusta (Evita o erro #130 do React)
      if (result?.error) {
        // Garante que a mensagem seja sempre uma string
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : "Ocorreu um erro desconhecido ao tentar fazer login."
        
        toast.error(errorMessage)
        setIsLoading(false)
        return
      } 
      
      if (result?.success) {
        // Grava no localStorage para controle de UI (Menus)
        if (result.role) {
          localStorage.setItem("userRole", result.role)
        }

        // Redirecionamento baseado no papel
        if (result.role === "admin") {
          toast.success("Login (Diretoria) realizado com sucesso!")
          router.push("/dashboard")
        } else {
          toast.success("Login realizado com sucesso!")
          router.push("/dashboard/accesses")
        }
      } else {
         // Caso de borda onde não há erro nem sucesso claro
         toast.error("Erro de comunicação com o servidor.")
         setIsLoading(false)
      }
    } catch (err) {
      console.error("Erro no login:", err)
      toast.error("Erro inesperado. Tente novamente.")
      setIsLoading(false)
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
            <form action={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">Chave de Acesso</Label>
                  <Input
                    id="password"
                    name="password"
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
