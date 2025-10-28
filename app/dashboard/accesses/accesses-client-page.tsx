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
} from "lucide-react" // Adicionados ícones
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
import { useRouter } from "next/navigation"

// Constante da senha
const DIRETORIA_PASSWORD = "491hrinh19283"

interface AccessesClientPageProps {
  initialAccesses: PlatformAccess[]
}

export function AccessesClientPage({ initialAccesses }: AccessesClientPageProps) {
  const [viewMode, setViewMode] = useState<"selection" | "diretoria" | "equipe">("selection")
  const [allAccesses, setAllAccesses] = useState<PlatformAccess[]>(initialAccesses)
  const [isLoading, setIsLoading] = useState(false) // Só controla loading *após* a carga inicial
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [hasDiretoriaAccess, setHasDiretoriaAccess] = useState(false)
  const router = useRouter()

  // Efeito para atualizar o estado interno se as props mudarem
  useEffect(() => {
    if (JSON.stringify(initialAccesses) !== JSON.stringify(allAccesses)) {
      setAllAccesses(initialAccesses)
    }
    setIsLoading(false)
  }, [initialAccesses, allAccesses])

  // Funções de clique e senha
  const handleDiretoriaClick = () => {
    if (hasDiretoriaAccess) {
      setViewMode("diretoria")
    } else {
      setPasswordError(null)
      setPasswordInput("")
      setShowPasswordDialog(true)
    }
  }
  const handleEquipeClick = () => {
    setViewMode("equipe")
  }
  const handlePasswordCheck = () => {
    if (passwordInput === DIRETORIA_PASSWORD) {
      setHasDiretoriaAccess(true)
      setShowPasswordDialog(false)
      setViewMode("diretoria")
      setPasswordError(null)
    } else {
      setPasswordError("Senha incorreta.")
    }
  }

  // *** ALTERAÇÃO PRINCIPAL: Cálculo das listas para as ABAS ***
  // Calcula as listas e contagens diretamente de allAccesses
  const diretoriaAccesses = allAccesses.filter((a) => a.department === "Diretoria")
  // Listas específicas para cada aba da Equipe/Diretoria (excluindo Diretoria)
  const tecnologiaAccesses = allAccesses.filter((a) => a.department === "Tecnologia")
  const producaoAccesses = allAccesses.filter((a) => a.department === "Produção")
  const marketingAccesses = allAccesses.filter((a) => a.department === "Marketing")
  const clienteAccesses = allAccesses.filter((a) => a.department === "Cliente")
  // Geral/Nulo: Exclui Diretoria e Cliente
  const geralAccesses = allAccesses.filter(
    (a) =>
      (a.department === "Geral" || a.department === null) && a.department !== "Diretoria" && a.department !== "Cliente",
  )

  // Determina qual aba deve ser a padrão ao entrar na view de Equipe ou Diretoria
  const getDefaultTab = () => {
    if (viewMode === "diretoria") return "diretoria"
    if (tecnologiaAccesses.length > 0) return "tecnologia"
    if (producaoAccesses.length > 0) return "producao"
    if (marketingAccesses.length > 0) return "marketing"
    if (geralAccesses.length > 0) return "geral"
    if (clienteAccesses.length > 0) return "clientes"
    return "tecnologia" // Fallback
  }

  // ---- RENDERIZAÇÃO ----

  // Carregamento inicial
  if (allAccesses.length === 0 && viewMode === "selection" && isLoading) {
    return <p>Carregando...</p>
  }

  // Tela de Seleção
  if (viewMode === "selection") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <KeyRound className="h-7 w-7" /> Acessos a Plataformas
        </h1>
        <p className="text-muted-foreground">Selecione a área que deseja visualizar:</p>
        <div className="flex gap-4">
          <Button size="lg" variant="outline" onClick={handleDiretoriaClick}>
            <Lock className="mr-2 h-5 w-5" /> Diretoria
          </Button>
          <Button size="lg" onClick={handleEquipeClick}>
            <UsersIcon className="mr-2 h-5 w-5" /> Equipe
          </Button>
        </div>
        {/* Diálogo de Senha */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock /> Acesso Restrito
              </DialogTitle>
              <DialogDescription>Digite a senha da diretoria para visualizar todos os acessos.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordCheck()}
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="button" onClick={handlePasswordCheck}>
                Entrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Tela Principal (Tabs + Tabelas)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setViewMode("selection")}>
            &larr; Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {viewMode === "diretoria" ? (
                <Unlock className="h-7 w-7 text-green-500" />
              ) : (
                <UsersIcon className="h-7 w-7" />
              )}
              Acessos - {viewMode === "diretoria" ? "Diretoria (Visão Completa)" : "Equipe"}
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

      {/* Alerta de Segurança */}
      <Card className="border-yellow-500 bg-yellow-500/5">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-yellow-700 text-base">Atenção</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600">
            Gerencie estas informações com cuidado. Evite expor senhas desnecessariamente. Use o campo
            "Senha/Informação" para dicas ou indique métodos alternativos (ex: "Login via Google", "Autenticação 2
            Fatores").
          </p>
        </CardContent>
      </Card>

      {/* *** ALTERAÇÃO PRINCIPAL: Estrutura das Abas *** */}
      {/* Define a aba padrão dinamicamente */}
      <Tabs defaultValue={getDefaultTab()} className="space-y-4">
        {/* Renderiza a lista de abas (diferente para diretoria e equipe) */}
        <TabsList className={`grid w-full ${viewMode === "diretoria" ? "grid-cols-6" : "grid-cols-5"}`}>
          {/* Aba Diretoria (Só na view diretoria) */}
          {viewMode === "diretoria" && (
            <TabsTrigger value="diretoria">
              <Building className="mr-2 h-4 w-4" /> Diretoria ({diretoriaAccesses.length})
            </TabsTrigger>
          )}
          {/* Abas Comuns */}
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

        {/* Conteúdo Aba Diretoria (Só na view diretoria) */}
        {viewMode === "diretoria" && (
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
        )}

        {/* Conteúdo Abas Comuns (Tecnologia, Produção, Marketing, Geral, Clientes) */}
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
      {/* *** FIM DA ALTERAÇÃO DAS ABAS *** */}
    </div>
  )
}

export default AccessesClientPage
