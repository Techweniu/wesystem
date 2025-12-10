"use client" // Necessário para gerenciar estado e interações

import type React from "react"

import { useState, useEffect, useMemo } from "react" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyRound, Building, Server, Palette, MicVocal, Contact, Globe, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { AddEditAccessForm } from "@/components/add-edit-access-form"
import { AccessTable } from "@/components/access-table"
import type { PlatformAccess } from "./page"
import { useRole } from "@/app/dashboard/layout"

interface AccessesClientPageProps {
  initialAccesses: PlatformAccess[]
}

type TabConfig = {
  value: string
  label: string
  icon: React.ElementType
  data: PlatformAccess[]
}

export function AccessesClientPage({ initialAccesses }: AccessesClientPageProps) {
  const userRole = useRole()
  const [allAccesses, setAllAccesses] = useState<PlatformAccess[]>(initialAccesses)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (JSON.stringify(initialAccesses) !== JSON.stringify(allAccesses)) {
      setAllAccesses(initialAccesses)
    }
  }, [initialAccesses, allAccesses])

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

  const diretoriaAccesses = filterAccesses(allAccesses.filter((a) => a.department === "Diretoria"))
  const tecnologiaAccesses = filterAccesses(allAccesses.filter((a) => a.department === "Tecnologia"))
  const producaoAccesses = filterAccesses(allAccesses.filter((a) => a.department === "Produção"))
  const marketingAccesses = filterAccesses(allAccesses.filter((a) => a.department === "Marketing"))
  const clienteAccesses = filterAccesses(allAccesses.filter((a) => a.department === "Cliente"))
  const geralAccesses = filterAccesses(
    allAccesses.filter(
      (a) =>
        (a.department === "Geral" || a.department === null) &&
        a.department !== "Diretoria" &&
        a.department !== "Cliente",
    ),
  )

  const allTabs: TabConfig[] = [
    { value: "diretoria", label: "Diretoria", icon: Building, data: diretoriaAccesses },
    { value: "tecnologia", label: "Tec", icon: Server, data: tecnologiaAccesses },
    { value: "producao", label: "Prod", icon: Palette, data: producaoAccesses },
    { value: "marketing", label: "Mkt", icon: MicVocal, data: marketingAccesses },
    { value: "geral", label: "Geral", icon: Globe, data: geralAccesses },
    { value: "clientes", label: "Clientes", icon: Contact, data: clienteAccesses },
  ]

  const visibleTabs = useMemo(() => {
    if (userRole === "limited") {
      // Exibe todas as abas EXCETO Diretoria e Tecnologia
      return allTabs.filter(
        (tab) => tab.value !== "diretoria" && tab.value !== "tecnologia",
      )
    }
    // Admin/Unlimited vê todas
    return allTabs 
  }, [userRole, allAccesses, searchTerm]) 

  const getDefaultTab = () => {
    const firstTabWithData = visibleTabs.find((tab) => tab.data.length > 0)
    return firstTabWithData ? firstTabWithData.value : visibleTabs[0]?.value || "producao"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <KeyRound className="h-7 w-7" />
              Acessos
            </h1>
            <p className="text-muted-foreground">Gerencie logins e informações de acesso.</p>
          </div>
        </div>
        {/* --- ALTERAÇÃO: Esconder botão se limitado --- */}
        {userRole !== "limited" && (
          <AddEditAccessForm>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Acesso
            </Button>
          </AddEditAccessForm>
        )}
        {/* --------------------------------------------- */}
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

      {searchTerm && visibleTabs.every((tab) => tab.data.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum resultado encontrado</p>
            <p className="text-sm text-muted-foreground">Tente pesquisar com outros termos</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={getDefaultTab()} className="space-y-4">
        {/* CORREÇÃO: Classes dinâmicas do Tailwind (ex: grid-cols-6) não funcionam se não forem safelisted.
          Substituído por style inline para garantir o grid correto independente do número de abas.
        */}
        <TabsList 
          className="grid w-full" 
          style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
        >
          {visibleTabs.map((tab) => (
            <TabsTrigger value={tab.value} key={tab.value}>
              <tab.icon className="mr-2 h-4 w-4" /> {tab.label} ({tab.data.length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="diretoria">
          <Card>
            <CardHeader>
              <CardTitle>Acessos da Diretoria</CardTitle>
              <CardDescription>Acessos administrativos e financeiros.</CardDescription>
            </CardHeader>
            <CardContent>
              <AccessTable accesses={diretoriaAccesses} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tecnologia">
          <Card>
            <CardHeader>
              <CardTitle>Acessos - Tecnologia</CardTitle>
            </CardHeader>
            <CardContent>
              <AccessTable accesses={tecnologiaAccesses} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="producao">
          <Card>
            <CardHeader>
              <CardTitle>Acessos - Produção</CardTitle>
            </CardHeader>
            <CardContent>
              <AccessTable accesses={producaoAccesses} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="marketing">
          <Card>
            <CardHeader>
              <CardTitle>Acessos - Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <AccessTable accesses={marketingAccesses} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Acessos - Geral / Sem Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <AccessTable accesses={geralAccesses} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clientes">
          <Card>
            <CardHeader>
              <CardTitle>Acessos de Clientes</CardTitle>
              <CardDescription>Logins específicos para plataformas de clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <AccessTable accesses={clienteAccesses} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AccessesClientPage
