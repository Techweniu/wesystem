"use client" // Necessário para gerenciar estado e interações

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  KeyRound,
  Building,
  UsersIcon,
  Lock,
  Unlock,
  Server,
  Palette,
  MicVocal,
  Contact,
  Globe,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { AddEditAccessForm } from "@/components/add-edit-access-form"
import { AccessTable } from "@/components/access-table"
import type { PlatformAccess } from "./page"
// Remove o 'useAuth'
// import { useAuth } from "@/contexts/auth-context" 

interface AccessesClientPageProps {
  initialAccesses: PlatformAccess[]
  // Remove 'userRole' das props
}

export function AccessesClientPage({ initialAccesses }: AccessesClientPageProps) {
  // Remove 'useAuth'
  // const { userRole } = useAuth() 
  const [allAccesses, setAllAccesses] = useState<PlatformAccess[]>(initialAccesses)
  const [searchTerm, setSearchTerm] = useState("")

  // Remove a lógica de senha
  // const [viewMode, setViewMode] = useState(...)
  
  // Efeito para atualizar o estado interno se as props mudarem
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

  // Calcula as listas e contagens (agora mostra tudo)
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

  // Determina qual aba deve ser a padrão
  const getDefaultTab = () => {
    if (tecnologiaAccesses.length > 0) return "tecnologia"
    if (producaoAccesses.length > 0) return "producao"
    if (marketingAccesses.length > 0) return "marketing"
    if (geralAccesses.length > 0) return "geral"
    if (clienteAccesses.length > 0) return "clientes"
    if (diretoriaAccesses.length > 0) return "diretoria"
    return "tecnologia" // Fallback
  }

  // Remove a lógica de 'viewMode' e 'passwordDialog'

  // Tela Principal (Tabs + Tabelas)
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
        <AddEditAccessForm>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Acesso
          </Button>
        </AddEditAccessForm>
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

      {searchTerm &&
        diretoriaAccesses.length === 0 &&
        tecnologiaAccesses.length === 0 &&
        producaoAccesses.length === 0 &&
        marketingAccesses.length === 0 &&
        geralAccesses.length === 0 &&
        clienteAccesses.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum resultado encontrado</p>
              <p className="text-sm text-muted-foreground">Tente pesquisar com outros termos</p>
            </CardContent>
          </Card>
        )}

      {/* Estrutura das Abas (Mostra todas as 6 abas) */}
      <Tabs defaultValue={getDefaultTab()} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="diretoria">
            <Building className="mr-2 h-4 w-4" /> Diretoria ({diretoriaAccesses.length})
          </TabsTrigger>
          <TabsTrigger value="tecnologia">
            <Server className="mr-2 h-4 w-4" /> Tec ({tecnologiaAccesses.length})
          </TabsTrigger>
          <TabsTrigger value="producao">
            <Palette className="mr-2 h-4 w-4" /> Prod ({producaoAccesses.length})
          </TabsTrigger>
          <TabsTrigger value="marketing">
            <MicVocal className="mr-2 h-4 w-4" /> Mkt ({marketingAccesses.length})
          </TabsTrigger>
          <TabsTrigger value="geral">
            <Globe className="mr-2 h-4 w-4" /> Geral ({geralAccesses.length})
          </TabsTrigger>
          <TabsTrigger value="clientes">
            <Contact className="mr-2 h-4 w-4" /> Clientes ({clienteAccesses.length})
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das Abas */}
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
