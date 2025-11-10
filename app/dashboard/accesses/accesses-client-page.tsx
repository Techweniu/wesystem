"use client" // Necessário para gerenciar estado e interações

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  KeyRound,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { AddEditAccessForm } from "@/components/add-edit-access-form"
import { AccessTable } from "@/components/access-table"
import type { PlatformAccess } from "./page"
import { useAuth } from "@/contexts/auth-context" // <-- IMPORTA O HOOK DE AUTENTICAÇÃO

interface AccessesClientPageProps {
  initialAccesses: PlatformAccess[]
  // userRole é removido das props, pois vem do useAuth
}

export function AccessesClientPage({ initialAccesses }: AccessesClientPageProps) {
  const { userRole, isLoading } = useAuth() // <-- OBTÉM A ROLE PELO CONTEXTO
  const [allAccesses, setAllAccesses] = useState<PlatformAccess[]>(initialAccesses)
  const [searchTerm, setSearchTerm] = useState("")

  // Efeito para atualizar o estado interno se as props mudarem
  useEffect(() => {
    setAllAccesses(initialAccesses)
  }, [initialAccesses])

  const filterAccesses = (accesses: PlatformAccess[]) => {
    if (!searchTerm.trim()) return accesses
    const term = searchTerm.toLowerCase()
    return accesses.filter((access) => {
      return (
        access.platform_name?.toLowerCase().includes(term) ||
        access.username?.toLowerCase().includes(term) ||
        access.notes?.toLowerCase().includes(term) ||
        access.client_name?.toLowerCase().includes(term)
      )
    })
  }

  // Filtra as listas de acesso (agora filtra 'Diretoria' e 'Cliente' para 'limited')
  const diretoriaAccesses = userRole === 'admin' ? filterAccesses(allAccesses.filter((a) => a.department === "Diretoria")) : []
  const tecnologiaAccesses = filterAccesses(allAccesses.filter((a) => a.department === "Tecnologia"))
  const producaoAccesses = filterAccesses(allAccesses.filter((a) => a.department === "Produção"))
  const marketingAccesses = filterAccesses(allAccesses.filter((a) => a.department === "Marketing"))
  const clienteAccesses = userRole === 'admin' ? filterAccesses(allAccesses.filter((a) => a.department === "Cliente")) : []
  const geralAccesses = filterAccesses(
    allAccesses.filter(
      (a) =>
        (a.department === "Geral" || a.department === null) &&
        a.department !== "Diretoria" &&
        a.department !== "Cliente", // Garante que não caiam aqui por engano
    ),
  )

  // Abas visíveis com base na role
  const TABS = [
    { value: "diretoria", label: "Diretoria", data: diretoriaAccesses, roles: ["admin"] },
    { value: "tecnologia", label: "Tecnologia", data: tecnologiaAccesses, roles: ["admin", "limited"] },
    { value: "producao", label: "Produção", data: producaoAccesses, roles: ["admin", "limited"] },
    { value: "marketing", label: "Marketing", data: marketingAccesses, roles: ["admin", "limited"] },
    { value: "geral", label: "Geral", data: geralAccesses, roles: ["admin", "limited"] },
    { value: "clientes", label: "Clientes", data: clienteAccesses, roles: ["admin"] },
  ]
  
  const visibleTabs = TABS.filter(tab => userRole && tab.roles.includes(userRole));
  const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].value : "";

  if (isLoading || !userRole) {
    return <p>Carregando acessos...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound className="h-7 w-7" />
            Acessos - {userRole === "admin" ? "Visão Completa" : "Equipe"}
          </h1>
          <p className="text-muted-foreground">Gerencie logins e informações de acesso.</p>
        </div>
        {userRole === "admin" && (
          <AddEditAccessForm>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Acesso
            </Button>
          </AddEditAccessForm>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar plataforma, login, notas ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className={`grid w-full grid-cols-${visibleTabs.length}`}>
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label} ({tab.data.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleTabs.map(tab => (
           <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader>
                <CardTitle>{tab.label}</CardTitle>
                {tab.value === 'clientes' && <CardDescription>Logins específicos para plataformas de clientes.</CardDescription>}
              </CardHeader>
              <CardContent>
                <AccessTable accesses={tab.data} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
