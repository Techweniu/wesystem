"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

type UserRole = "admin" | "limited" | null

interface AuthContextType {
  userRole: UserRole
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Define as rotas permitidas para o role 'limited' (Conforme seu pedido)
const limitedUserPaths = [
  "/dashboard/clients",
  "/dashboard/org-chart",
  "/dashboard/accesses",
  "/dashboard/chat",
]

// Função para verificar se o path é permitido (executada no cliente)
function isPathAllowed(path: string, role: UserRole) {
  if (!role) return false;
  if (role === 'admin') {
    return true // Admin pode acessar tudo
  }
  if (role === 'limited') {
    // Permite acesso exato ou a sub-rotas (ex: /dashboard/clients/[id])
    return limitedUserPaths.some(allowedPath => path.startsWith(allowedPath));
  }
  return false
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const role = localStorage.getItem("userRole") as UserRole
    
    if (role === "admin" || role === "limited") {
      setUserRole(role)

      // --- Verificação de Segurança e Redirecionamento ---
      
      // 1. Se for 'limited' e tentar aceder ao dashboard principal
      if (role === 'limited' && pathname === '/dashboard') {
        router.replace('/dashboard/clients')
      }
      
      // 2. Se tentar aceder a uma página não permitida para a sua role
      if (!isPathAllowed(pathname, role)) {
        // Redireciona para a página padrão (admin vai para /dashboard, limited vai para /clients)
        const defaultPath = role === 'limited' ? '/dashboard/clients' : '/dashboard'
        router.replace(defaultPath)
      }

    } else {
      // Se não houver role válida ou for 'null', envia para o login
      localStorage.removeItem("userRole")
      router.replace("/auth/login")
    }
    setIsLoading(false)
  }, [router, pathname])

  return (
    <AuthContext.Provider value={{ userRole, isLoading }}>
      {isLoading ? (
        <div className="flex h-screen w-full items-center justify-center">Carregando sistema...</div>
      ) : (
        // Só renderiza os filhos se o papel for válido (evita flash de conteúdo)
        userRole ? children : null
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
