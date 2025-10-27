// Caminho: wesystem7/app/dashboard/clients/[id]/page.tsx
"use client"; // Necessário para useState, useEffect e useTransition

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound, useRouter } from "next/navigation"; // useRouter para refresh
import { Mail, Phone, Calendar, Download, FileText, Building, MapPin, AlertTriangle, Star, History, BarChart2, ThumbsDown, CheckSquare, Square } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddServiceForm } from "@/components/add-service-form";
import { AddNpsForm } from "@/components/add-nps-form";
import { AddContractForm } from "@/components/add-contract-form";
import { EditContractForm } from "@/components/edit-contract-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { EditClientInfoForm } from "@/components/edit-client-info-form";
import { EditClientNotesForm } from "@/components/edit-client-notes-form";
import { Button } from "@/components/ui/button";
import { ServiceStatusChanger } from "@/components/service-status-changer";
import { Separator } from "@/components/ui/separator";
import { ClientContactsManager } from "@/components/client-contacts-manager";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/client"; // Usar client do browser
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { toast } from "sonner"; // Import toast
import { updateClientServiceStatus } from "./actions"; // Importar a nova action
import { cn } from "@/lib/utils"; // Import cn utility

const LOOKER_STUDIO_URL = "https://lookerstudio.google.com/embed/reporting/dd2d13f5-60b6-4926-ba5d-afe9db7dbcd1/page/jCyaF";

interface NpsCategoryScores { [key: string]: number; }
interface NpsResponse { id: string; client_id: string; score: number; comment: string | null; response_date: string; created_at: string; category_scores: NpsCategoryScores | null; observations: string | null; }
interface Contract { id: string; name: string; status: 'active' | 'inactive'; valor_mensal: number; start_date: string | null; end_date: string | null; storage_path: string | null; downloadUrl?: string; }
interface OneTimeService { id: string; name: string; value: number; date: string; status: 'pending' | 'completed' | 'cancelled'; }
interface ClientContact { id: string; name: string; role: string | null; email: string | null; phone: string | null; birth_date: string | null; }
interface ClientService { id: string; is_done: boolean; services: { name: string } | null; } // Estrutura ajustada
interface ClientData {
    id: string; name: string; status: "active" | "inactive" | "prospect"; health_status: "green" | "yellow" | "red" | null; contact_email: string | null; contact_phone: string | null;
    cnpj: string | null; address: string | null; credit_risk: string | null; client_notes: string | null; objectives: string | null; created_at: string;
    contracts: Contract[]; one_time_services: OneTimeService[]; nps_responses: NpsResponse[]; client_contacts: ClientContact[];
    client_services: ClientService[]; // Adicionado
}

// Componente Checkbox para Serviços Contratados
const ClientServiceCheckbox = ({ service, clientId }: { service: ClientService, clientId: string }) => {
    const [isChecked, setIsChecked] = useState(service.is_done);
    const [isPending, startTransition] = useTransition();
    const router = useRouter(); // Para refresh se necessário

    const handleChange = (checked: boolean | "indeterminate") => {
        // Handle only boolean changes for checkbox
        if (typeof checked !== 'boolean') return;

        setIsChecked(checked); // Atualiza otimisticamente
        startTransition(async () => {
            const result = await updateClientServiceStatus({
                clientServiceId: service.id,
                isDone: checked,
                clientId: clientId
            });
            if (result.error) {
                toast.error("Erro ao atualizar serviço", { description: result.error });
                setIsChecked(!checked); // Reverte em caso de erro
            } else {
                toast.success(result.success);
                // Opcional: router.refresh() se a revalidação não for suficiente
            }
        });
    };

    return (
        <div className="flex items-center space-x-2 py-1">
            <Checkbox
                id={`service-${service.id}`}
                checked={isChecked}
                onCheckedChange={handleChange}
                disabled={isPending}
            />
            <label
                htmlFor={`service-${service.id}`}
                className={cn( // Use cn importado
                    `text-sm font-medium leading-none`,
                    isChecked ? 'line-through text-muted-foreground' : '',
                    isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                )}
            >
                {service.services?.name || 'Serviço Desconhecido'}
            </label>
        </div>
    );
};


export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("clients")
      .select(`
        *,
        contracts(*),
        one_time_services(*),
        nps_responses(*),
        client_contacts(*),
        client_services(id, is_done, services(name)) /* Busca o nome do serviço */
      `)
      .eq("id", id)
      .order('created_at', { foreignTable: 'contracts', ascending: false })
      .order('response_date', { foreignTable: 'nps_responses', ascending: false })
      .order('date', { foreignTable: 'one_time_services', ascending: false })
      .order('name', {foreignTable: 'client_services.services'}) // Ordena os serviços por nome
      .single();

    if (fetchError) {
      console.error("Erro ao buscar detalhes do cliente (client-side):", fetchError);
      setError("Cliente não encontrado ou erro ao carregar dados.");
      setClient(null);
    } else {
      // Gera URLs de download para contratos
      if (data && data.contracts) {
        for (const contract of data.contracts) {
          if (contract.storage_path) {
            const { data: urlData } = await supabase.storage.from('contracts').createSignedUrl(contract.storage_path, 60 * 60);
            (contract as any).downloadUrl = urlData?.signedUrl;
          }
        }
      }
      setClient(data);
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Dependência id adicionada

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]); // Adiciona fetchClientDetails às dependências

  // --- Cálculos (movidos para dentro do componente) ---
  const today = new Date();
  const isContractVigent = (contract: { start_date: string | null, end_date: string | null }) => {
    const hasStarted = contract.start_date ? isPast(parseISO(contract.start_date)) || format(parseISO(contract.start_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') : true;
    const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true;
    return hasStarted && hasNotEnded;
  }
  const monthlyRevenue = client?.contracts?.filter(c => c.status === 'active' && isContractVigent(c)).reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0;
  const completedOneTimeServices = client?.one_time_services?.filter((s) => s.status === "completed") || [];
  const totalOneTimeServicesRevenue = completedOneTimeServices.reduce((sum, s) => sum + Number(s.value), 0) || 0;
  const npsScores = client?.nps_responses?.map((n) => n.score) || [];
  const avgNps = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 0;
  const latestNpsResponse = client?.nps_responses?.[0];
  const latestNpsScore = latestNpsResponse?.score;

  let worstNpsCategories: { category: string; score: number }[] = [];
  if (latestNpsResponse?.category_scores) {
    worstNpsCategories = Object.entries(latestNpsResponse.category_scores)
      .map(([category, score]) => ({ category: category.replace(/_/g, ' '), score }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }

  const getNpsBadgeVariant = (nps: number | undefined): 'destructive' | 'secondary' | 'default' | 'outline' => {
    if (nps === undefined) return 'outline';
    if (nps <= 7) return 'destructive'; // Ajustado para 0-7
    if (nps === 8) return 'secondary';
    return 'default';
  };

  let generatedValue = 0;
  client?.contracts?.forEach(contract => {
      if (contract.start_date && contract.valor_mensal > 0) {
          const startDate = parseISO(contract.start_date);
          const daysPassed = differenceInDays(today, startDate);
          if (daysPassed >= 0) {
              generatedValue += (contract.valor_mensal / 30.44) * (daysPassed + 1);
          }
      }
  });
  generatedValue += totalOneTimeServicesRevenue; // Adiciona receita de serviços pontuais

  let firstContractDate = client?.created_at;
  let furthestEndDate: string | null = null;
  const activeContracts = client?.contracts?.filter(c => c.status === 'active' && isContractVigent(c));
  if (activeContracts && activeContracts.length > 0) {
      const contractsWithStartDate = activeContracts.filter(c => c.start_date);
      if (contractsWithStartDate.length > 0 && firstContractDate) { // Verifica se firstContractDate existe
        firstContractDate = contractsWithStartDate.reduce((earliest, current) => (parseISO(current.start_date!) < parseISO(earliest.start_date!) ? current : earliest)).start_date!;
      }

      const contractsWithEndDate = activeContracts.filter(c => c.end_date);
      if (contractsWithEndDate.length > 0) {
        furthestEndDate = contractsWithEndDate.reduce((furthest, current) => (parseISO(current.end_date!) > parseISO(furthest.end_date!) ? current : furthest)).end_date!;
      }
  }
  // --- Fim dos Cálculos ---

  if (isLoading) {
    return (
        <div className="space-y-6 animate-pulse">
            <Skeleton className="h-8 w-1/3" /> {/* Breadcrumb */}
            <div className="flex items-start justify-between">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" /> {/* Title */}
                    <Skeleton className="h-4 w-48" /> {/* Subtitle */}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)} {/* Stat Cards */}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Skeleton className="h-48 rounded-xl" /> {/* Info Card */}
                 <Skeleton className="h-48 rounded-xl" /> {/* Notes Card */}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Skeleton className="h-64 rounded-xl" /> {/* Contacts Card */}
                 <Skeleton className="h-64 rounded-xl" /> {/* Services Card */}
                 <Skeleton className="h-64 rounded-xl" /> {/* History Card */}
            </div>
             <Skeleton className="h-96 rounded-xl" /> {/* Contracts Card */}
             <Skeleton className="h-[500px] rounded-xl" /> {/* Dashboard Card */}
             <Skeleton className="h-10 w-1/3 mb-4 rounded-lg" /> {/* Tabs List */}
             <Skeleton className="h-72 rounded-xl" /> {/* Tab Content */}
        </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>; // Exibe mensagem de erro
  }

  if (!client) {
    // Teoricamente, não deve chegar aqui se error for tratado, mas é um fallback
    notFound();
  }

  return (
    <div className="space-y-6">
        <Breadcrumb>
             <BreadcrumbList>
                <BreadcrumbItem>
                <BreadcrumbLink asChild>
                    <Link href="/dashboard/clients">Clientes</Link>
                </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>{client.name}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                <p className="text-muted-foreground">Central de Informações do Cliente</p>
            </div>
        </div>

        <div className="flex flex-col gap-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status</CardTitle></CardHeader><CardContent><Badge variant={client.status === "active" ? "default" : "outline"}>{client.status === "active" ? "Ativo" : client.status === "prospect" ? "Prospect" : "Inativo"}</Badge></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Receita Mensal (MRR)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyRevenue)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Valor Gerado (Est.)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(generatedValue)}</div></CardContent></Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">NPS Médio</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-1">
                    <div className="text-2xl font-bold">{avgNps.toFixed(1)}</div>
                    {latestNpsScore !== undefined ? (<div className="text-xs text-muted-foreground items-center flex gap-1">Último:<Badge variant={getNpsBadgeVariant(latestNpsScore)} className="px-1.5 py-0">{latestNpsScore}</Badge></div>
                    ) : (<p className="text-xs text-muted-foreground">Último: -</p>)}
                    {worstNpsCategories.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-dashed border-border/50">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-0.5"><ThumbsDown className="h-3 w-3 text-destructive" /> Piores Tópicos (Último NPS):</p>
                        <ul className="space-y-0.5">
                          {worstNpsCategories.map(item => (<li key={item.category} className="flex justify-between items-center text-xs"><span className="text-muted-foreground">{item.category}:</span><Badge variant={getNpsBadgeVariant(item.score)} className="px-1 py-0 text-[10px]">{item.score}</Badge></li>))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Informações do Cliente</CardTitle>
                        <EditClientInfoForm client={client} />
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start gap-2"><p className="font-semibold w-16 shrink-0">CNPJ:</p><p>{client.cnpj || "Não informado"}</p></div>
                        <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /><p>{client.address || "Não informado"}</p></div>
                        <div className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /><p><strong>Risco de Crédito:</strong> {client.credit_risk || "Não informado"}</p></div>
                         <div className="flex items-start gap-2"><Mail className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /><p>{client.contact_email || "Não informado"}</p></div>
                        <div className="flex items-start gap-2"><Phone className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /><p>{client.contact_phone || "Não informado"}</p></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Nota e Objetivos</CardTitle>
                        <EditClientNotesForm client={client} />
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold mb-1">Nota do Cliente</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap">{client.client_notes || "Nenhuma nota adicionada."}</p>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-1">Objetivos com a Parceria</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap">{client.objectives || "Nenhum objetivo definido."}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ClientContactsManager clientId={client.id} contacts={client.client_contacts || []} />

                {/* --- CARD DE SERVIÇOS CONTRATADOS --- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" /> Serviços Contratados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {client.client_services && client.client_services.length > 0 ? (
                            <div className="space-y-2">
                                {client.client_services
                                    .sort((a, b) => (a.services?.name ?? '').localeCompare(b.services?.name ?? '')) // Ordena alfabeticamente
                                    .map((cs) => (
                                    <ClientServiceCheckbox key={cs.id} service={cs} clientId={client.id} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum serviço específico contratado. Adicione serviços ao criar o cliente.
                            </p>
                        )}
                    </CardContent>
                </Card>
                {/* --- FIM DO CARD DE SERVIÇOS --- */}

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico e CX</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between items-center"><span>Receita Mensal (MRR):</span> <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyRevenue)}</strong></div>
                        <div className="flex justify-between items-center"><span>Serviços Pontuais (Total):</span> <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalOneTimeServicesRevenue)}</strong></div>
                        <div className="flex justify-between items-center text-base"><strong>Valor Gerado (Total):</strong> <strong className="text-lg">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(generatedValue)}</strong></div>
                        <Separator />
                        <div className="flex justify-between items-center"><strong>Aniversário da Parceria:</strong> <span>{firstContractDate ? format(parseISO(firstContractDate), 'dd/MM/yyyy') : 'N/A'}</span></div>
                        <div className="flex justify-between items-center"><strong>Vencimento Próximo Contrato:</strong> <span>{furthestEndDate ? format(parseISO(furthestEndDate), 'dd/MM/yyyy') : 'Indeterminado'}</span></div>
                        <div className="flex justify-between items-center">
                            <strong>NPS Médio:</strong>
                            <div className="flex items-center gap-2">
                                <Badge variant={getNpsBadgeVariant(avgNps)}>{avgNps.toFixed(1)}</Badge>
                                {latestNpsScore !== undefined && (<><span className="text-xs text-muted-foreground">(Último:</span><Badge variant={getNpsBadgeVariant(latestNpsScore)} className="px-1.5 py-0">{latestNpsScore}</Badge><span className="text-xs text-muted-foreground">)</span></>)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
             </div>

             {/* Produtos Contratados (Contracts) */}
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Produtos Contratados (Contratos)</CardTitle>
                    <AddContractForm clientId={client.id} />
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 mt-4">
                    {client.contracts?.map((contract: Contract) => ( // Use o tipo Contract
                      <li key={contract.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{contract.name}</span>
                            <span className="text-xs text-muted-foreground">Início: {contract.start_date ? format(parseISO(contract.start_date), 'dd/MM/yyyy') : 'N/A'}</span>
                             {contract.valor_mensal > 0 && <span className="text-xs text-muted-foreground">Valor: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(contract.valor_mensal)}/mês</span>}
                          </div>
                           <Badge variant={contract.status === 'active' ? 'default' : 'outline'}>{contract.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            {contract.downloadUrl && (<a href={contract.downloadUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button></a>)}
                            <EditContractForm contract={contract} />
                        </div>
                      </li>
                    ))}
                    {client.contracts?.length === 0 && (<div className="text-center text-sm text-muted-foreground h-24 flex items-center justify-center">Nenhum contrato adicionado.</div>)}
                   </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Dashboard de Resultados</CardTitle></CardHeader>
                <CardContent>
                    <div className="aspect-video w-full">
                        <iframe title="Looker Studio Dashboard" width="100%" height="100%" src={LOOKER_STUDIO_URL} frameBorder="0" style={{ border: 0, borderRadius: "var(--radius)" }} allowFullScreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="services">
                <TabsList>
                    <TabsTrigger value="services">Histórico de Serviços</TabsTrigger>
                    <TabsTrigger value="nps">Histórico de NPS</TabsTrigger>
                </TabsList>
                <TabsContent value="services">
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Serviços Pontuais</CardTitle><AddServiceForm clientId={client.id} /></CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {client.one_time_services?.map((service) => (<TableRow key={service.id}><TableCell className="font-medium">{service.name}</TableCell><TableCell>{format(parseISO(service.date), 'dd/MM/yyyy')}</TableCell><TableCell><ServiceStatusChanger service={{ id: service.id, status: service.status, clientId: client.id }} /></TableCell><TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.value)}</TableCell></TableRow>))}
                                {client.one_time_services?.length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum serviço pontual registrado.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                         </CardContent>
                       </Card>
                </TabsContent>
                <TabsContent value="nps">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Histórico de NPS</CardTitle><AddNpsForm clientId={client.id} /></CardHeader>
                        <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {client.nps_responses?.map((response, index) => (<AccordionItem value={`item-${index}`} key={response.id}><AccordionTrigger><div className="flex justify-between items-center w-full pr-4"><span>Avaliação de {format(parseISO(response.response_date), 'dd/MM/yyyy')}</span><Badge variant={getNpsBadgeVariant(response.score)}>Nota Geral: {response.score}/10</Badge></div></AccordionTrigger><AccordionContent><div className="p-4 bg-muted/50 rounded-md"><h4 className="font-semibold mb-2">Notas por Categoria:</h4>{response.category_scores && Object.keys(response.category_scores).length > 0 ? (<ul className="list-disc pl-5 space-y-1 text-sm">{Object.entries(response.category_scores).map(([category, score]) => (<li key={category}><span className="font-medium">{category.replace(/_/g, ' ')}:</span> {String(score)}/10</li>))}</ul>) : (<p className="text-sm text-muted-foreground">Nenhuma nota por categoria registrada.</p>)}{response.observations && (<div className="mt-4"><h4 className="font-semibold mb-1">Observações:</h4><p className="text-sm text-muted-foreground italic">"{response.observations}"</p></div>)}{!response.observations && response.comment && (<div className="mt-4"><h4 className="font-semibold mb-1">Observações (Comentário):</h4><p className="text-sm text-muted-foreground italic">"{response.comment}"</p></div>)}</div></AccordionContent></AccordionItem>))}
                            {client.nps_responses?.length === 0 && (<div className="text-center text-sm text-muted-foreground h-24 flex items-center justify-center">Nenhuma avaliação NPS registrada.</div>)}
                        </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    </div>
  )
}
