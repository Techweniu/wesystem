"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

type UserRole = "admin" | "limited" | null

interface AuthContextType {
  userRole: UserRole
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const role = localStorage.getItem("userRole") as UserRole
    
    if (role === "admin" || role === "limited") {
      setUserRole(role)
      // Se for 'limited' e tentar aceder ao dashboard principal, redireciona
      if (role === 'limited' && pathname === '/dashboard') {
        router.replace('/dashboard/clients')
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
        children
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
