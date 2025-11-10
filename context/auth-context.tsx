"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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

  useEffect(() => {
    const role = localStorage.getItem("userRole") as UserRole
    if (role === "admin" || role === "limited") {
      setUserRole(role)
    } else {
      // Se não houver role válida, força o logout
      localStorage.removeItem("userRole")
      router.push("/auth/login")
    }
    setIsLoading(false)
  }, [router])

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
