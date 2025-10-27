"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, KeyRound, Building, Users as UsersIcon, User, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { AddEditAccessForm } from "@/components/add-edit-access-form";
import { Skeleton } from "@/components/ui/skeleton";
import { AccessTable } from "@/components/access-table";
import type { PlatformAccess } from "./page"; // Importa o tipo do page.tsx

// Constante da senha
const DIRETORIA_PASSWORD = "491hrinh19283";

interface AccessesClientPageProps {
  initialAccesses: PlatformAccess[];
}

// ****** VERIFIQUE ESTA LINHA ******
export function AccessesClientPage({ initialAccesses }: AccessesClientPageProps) {
// **********************************
  const [viewMode, setViewMode] = useState<'selection' | 'diretoria' | 'equipe'>('selection');
  const [allAccesses, setAllAccesses] = useState<PlatformAccess[]>(initialAccesses);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [hasDiretoriaAccess, setHasDiretoriaAccess] = useState(false);

  // Efeito para atualizar o estado interno se as props mudarem
  useEffect(() => {
    setAllAccesses(initialAccesses);
  }, [initialAccesses]);

  // Funções de clique e verificação de senha
  const handleDiretoriaClick = () => {
    if (hasDiretoriaAccess) {
      setViewMode('diretoria');
    } else {
      setPasswordError(null);
      setPasswordInput("");
      setShowPasswordDialog(true);
    }
  };
  const handleEquipeClick = () => {
    setViewMode('equipe');
  };
  const handlePasswordCheck = () => {
    if (passwordInput === DIRETORIA_PASSWORD) {
      setHasDiretoriaAccess(true);
      setShowPasswordDialog(false);
      setViewMode('diretoria');
      setPasswordError(null);
    } else {
      setPasswordError("Senha incorreta.");
    }
  };

  // Calcula as listas e contagens diretamente de allAccesses
  const diretoriaAccesses = allAccesses.filter(a => a.department === 'Diretoria');
  const equipeAccesses = allAccesses.filter(a => a.department !== 'Diretoria' && a.department !== 'Cliente');
  const clienteAccesses = allAccesses.filter(a => a.department === 'Cliente');

  // Determina qual lista usar na tabela da aba 'Equipe'
  const equipeTableData = viewMode === 'diretoria' ? equipeAccesses : allAccesses.filter(a => a.department !== 'Diretoria');


  // ---- RENDERIZAÇÃO ----

  // Tela de Seleção
  if (viewMode === 'selection') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><KeyRound className="h-7 w-7" /> Acessos a Plataformas</h1>
           <p className="text-muted-foreground">Selecione a área que deseja visualizar:</p>
           <div className="flex gap-4">
             <Button size="lg" variant="outline" onClick={handleDiretoriaClick}><Lock className="mr-2 h-5 w-5" /> Diretoria</Button>
             <Button size="lg" onClick={handleEquipeClick}><UsersIcon className="mr-2 h-5 w-5" /> Equipe</Button>
           </div>
           {/* Diálogo de Senha */}
           <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
               <DialogContent className="sm:max-w-[425px]">
                   <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock /> Acesso Restrito</DialogTitle><DialogDescription>Digite a senha da diretoria para visualizar todos os acessos.</DialogDescription></DialogHeader>
                   <div className="grid gap-4 py-4"><div className="grid gap-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasswordCheck()}/>{passwordError && <p className="text-sm text-destructive">{passwordError}</p>}</div></div>
                   <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="button" onClick={handlePasswordCheck}>Entrar</Button></DialogFooter>
               </DialogContent>
           </Dialog>
       </div>
    );
  }

  // Tela Principal (Tabs + Tabelas)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={() => setViewMode('selection')}>&larr; Voltar</Button>
             <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    {viewMode === 'diretoria' ? <Unlock className="h-7 w-7 text-green-500" /> : <UsersIcon className="h-7 w-7" />}
                    Acessos - {viewMode === 'diretoria' ? 'Diretoria (Visão Completa)' : 'Equipe'}
                </h1>
                <p className="text-muted-foreground">Gerencie logins e informações de acesso.</p>
             </div>
        </div>
         <AddEditAccessForm>
            <Button><PlusCircle className="mr-2 h-4 w-4" />Adicionar Acesso</Button>
         </AddEditAccessForm>
      </div>

       {/* Alerta de Segurança */}
       <Card className="border-yellow-500 bg-yellow-500/5">
         <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2"><AlertTriangle className="h-5 w-5 text-yellow-600" /><CardTitle className="text-yellow-700 text-base">Atenção</CardTitle></CardHeader>
         <CardContent><p className="text-sm text-yellow-600">Gerencie estas informações com cuidado. Evite expor senhas desnecessariamente. Use o campo "Senha/Informação" para dicas ou indique métodos alternativos (ex: "Login via Google", "Autenticação 2 Fatores").</p></CardContent>
       </Card>

      {/* Tabs e Tabelas */}
      <Tabs defaultValue={viewMode === 'diretoria' ? 'diretoria' : 'equipe'} className="space-y-4">
         {viewMode === 'diretoria' && (
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="diretoria"><Building className="mr-2 h-4 w-4" /> Diretoria ({diretoriaAccesses.length})</TabsTrigger>
                <TabsTrigger value="equipe"><UsersIcon className="mr-2 h-4 w-4" /> Equipe ({equipeAccesses.length})</TabsTrigger>
                <TabsTrigger value="clientes"><User className="mr-2 h-4 w-4" /> Clientes ({clienteAccesses.length})</TabsTrigger>
            </TabsList>
         )}

        {viewMode === 'diretoria' && (
            <TabsContent value="diretoria">
                <Card>
                    <CardHeader><CardTitle>Acessos da Diretoria</CardTitle><CardDescription>Acessos administrativos e financeiros.</CardDescription></CardHeader>
                    <CardContent>
                     {/* Verifica se allAccesses tem dados antes de passar */}
                     {allAccesses.length > 0 ? <AccessTable accesses={diretoriaAccesses} /> : <p className="text-muted-foreground text-center py-4">Carregando ou nenhum acesso encontrado.</p>}
                    </CardContent>
                </Card>
            </TabsContent>
        )}

        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acessos da Equipe</CardTitle>
              <CardDescription>{viewMode === 'diretoria' ? "Acessos gerais (excluindo Diretoria e Clientes)." : "Acessos gerais (excluindo Diretoria)."}</CardDescription>
            </CardHeader>
            <CardContent>
               {allAccesses.length > 0 ? <AccessTable accesses={equipeTableData} /> : <p className="text-muted-foreground text-center py-4">Carregando ou nenhum acesso encontrado.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardHeader><CardTitle>Acessos de Clientes</CardTitle><CardDescription>Logins específicos para plataformas de clientes.</CardDescription></CardHeader>
            <CardContent>
               {allAccesses.length > 0 ? <AccessTable accesses={clienteAccesses} /> : <p className="text-muted-foreground text-center py-4">Carregando ou nenhum acesso encontrado.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
