// Em wesystem6/app/dashboard/clients/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound } from "next/navigation";
import { Mail, Phone, Calendar, Download, FileText, Building, MapPin, AlertTriangle, Star, History, BarChart2, ThumbsDown } from "lucide-react"; // Adicionado ThumbsDown
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddServiceForm } from "@/components/add-service-form";
import { AddNpsForm } from "@/components/add-nps-form";
import { AddContractForm } from "@/components/add-contract-form";
import { EditContractForm } from "@/components/edit-contract-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
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

const LOOKER_STUDIO_URL = "https://lookerstudio.google.com/embed/reporting/dd2d13f5-60b6-4926-ba5d-afe9db7dbcd1/page/jCyaF";

// Interface para tipar category_scores (ajuste conforme a estrutura real no Supabase)
interface NpsCategoryScores {
    [key: string]: number;
}

// Interface para tipar a resposta NPS completa
interface NpsResponse {
    id: string;
    client_id: string;
    score: number;
    comment: string | null;
    response_date: string;
    created_at: string;
    category_scores: NpsCategoryScores | null; // Adicionando category_scores
    observations: string | null; // Adicionando observations (se existir)
}


async function getClientDetails(id: string) {
  const supabase = await createClient();
  // Busca ordenada já garante que o primeiro nps_response é o mais recente
  // Garantir que category_scores está sendo selecionado (usando * ou explicitamente)
  const { data: client, error } = await supabase
    .from("clients")
    .select(`*, contracts(*), one_time_services(*), nps_responses(*), client_contacts(*)`) // O '*' em nps_responses(*) já deve incluir category_scores
    .eq("id", id)
    .order('created_at', { foreignTable: 'contracts', ascending: false })
    .order('response_date', { foreignTable: 'nps_responses', ascending: false }) // Mais recente primeiro
    .order('date', { foreignTable: 'one_time_services', ascending: false })
    .single();

  if (error) {
    console.error("Erro ao buscar detalhes do cliente:", error); // Adiciona log de erro
    return null;
   }

  // Geração de URL de download para contratos (sem alterações)
  if (client && client.contracts) {
    for (const contract of client.contracts) {
      if (contract.storage_path) {
        const { data } = await supabase.storage.from('contracts').createSignedUrl(contract.storage_path, 60 * 60);
        (contract as any).downloadUrl = data?.signedUrl;
      }
    }
  }
  return client;
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const client = await getClientDetails(id);

  if (!client) { notFound(); }

  const today = new Date();

  const isContractVigent = (contract: { start_date: string | null, end_date: string | null }) => {
    const hasStarted = contract.start_date ? isPast(parseISO(contract.start_date)) || format(parseISO(contract.start_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') : true;
    const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true;
    return hasStarted && hasNotEnded;
  }

  const monthlyRevenue = client.contracts?.filter(c => c.status === 'active' && isContractVigent(c)).reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0;

  const completedServices = client.one_time_services?.filter((s: any) => s.status === "completed") || [];
  const totalServicesRevenue = completedServices.reduce((sum, s: any) => sum + Number(s.value), 0) || 0;

  // Cálculo da média de NPS (sem alterações)
  const npsScores = client.nps_responses?.map((n: any) => n.score) || [];
  const avgNps = npsScores.length > 0 ? npsScores.reduce((a: number, b: number) => a + b, 0) / npsScores.length : 0;

  // Pega a resposta NPS mais recente (como objeto tipado)
  const latestNpsResponse = client.nps_responses?.[0] as NpsResponse | undefined;
  const latestNpsScore = latestNpsResponse?.score;

  // ======> LÓGICA ADICIONADA PARA PEGAR OS 3 PIORES TÓPICOS: <=====
  let worstNpsCategories: { category: string; score: number }[] = [];
  if (latestNpsResponse?.category_scores) {
    worstNpsCategories = Object.entries(latestNpsResponse.category_scores)
      .map(([category, score]) => ({ category: category.replace(/_/g, ' '), score })) // Mapeia para objeto e formata nome
      .sort((a, b) => a.score - b.score) // Ordena por nota (menor primeiro)
      .slice(0, 3); // Pega os 3 piores
  }
  // =============================================================

  // Função para determinar a variante do Badge com base no NPS (sem alterações)
  const getNpsBadgeVariant = (nps: number | undefined): 'destructive' | 'secondary' | 'default' | 'outline' => {
    if (nps === undefined) return 'outline';
    if (nps <= 7) return 'destructive';
    if (nps === 8) return 'secondary';
    return 'default';
  };

  let generatedValue = 0;
  client.contracts?.forEach(contract => {
      if (contract.start_date && contract.valor_mensal > 0) {
          const startDate = parseISO(contract.start_date);
          const daysPassed = differenceInDays(today, startDate);
          if (daysPassed >= 0) {
              generatedValue += (contract.valor_mensal / 30.44) * (daysPassed + 1);
          }
      }
  });
  generatedValue += totalServicesRevenue;

  let firstContractDate = client.created_at;
  let furthestEndDate: string | null = null;
  const activeContracts = client.contracts?.filter(c => c.status === 'active' && isContractVigent(c));
  if (activeContracts && activeContracts.length > 0) {
      const contractsWithStartDate = activeContracts.filter(c => c.start_date);
      if (contractsWithStartDate.length > 0) {
        firstContractDate = contractsWithStartDate.reduce((earliest, current) => (parseISO(current.start_date!) < parseISO(earliest.start_date!) ? current : earliest)).start_date!;
      }

      const contractsWithEndDate = activeContracts.filter(c => c.end_date);
      if (contractsWithEndDate.length > 0) {
        furthestEndDate = contractsWithEndDate.reduce((furthest, current) => (parseISO(current.end_date!) > parseISO(furthest.end_date!) ? current : furthest)).end_date!;
      }
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
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status</CardTitle></CardHeader><CardContent><Badge variant={client.status === "active" ? "default" : "outline"}>{client.status === "active" ? "Ativo" : "Inativo"}</Badge></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Receita Mensal (MRR)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyRevenue)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Valor Gerado (Est.)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(generatedValue)}</div></CardContent></Card>
                {/* ======> CARD DE NPS MÉDIO ALTERADO ABAIXO PARA INCLUIR PIORES TÓPICOS: <===== */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">NPS Médio</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1"> {/* Flex Col para empilhar */}
                    <div className="text-2xl font-bold">{avgNps.toFixed(1)}</div>
                    {latestNpsScore !== undefined ? (
                      <div className="text-xs text-muted-foreground items-center flex gap-1"> {/* Flex para alinhar badge */}
                        Último:
                        <Badge variant={getNpsBadgeVariant(latestNpsScore)} className="px-1.5 py-0">
                          {latestNpsScore}
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Último: -</p>
                    )}
                    {/* Mostra os piores tópicos se existirem */}
                    {worstNpsCategories.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-dashed border-border/50">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-0.5">
                           <ThumbsDown className="h-3 w-3 text-destructive" /> Piores Tópicos (Último NPS):
                        </p>
                        <ul className="space-y-0.5">
                          {worstNpsCategories.map(item => (
                            <li key={item.category} className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">{item.category}:</span>
                              <Badge variant={getNpsBadgeVariant(item.score)} className="px-1 py-0 text-[10px]">
                                {item.score}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* ======================================================================= */}
            </div>

            {/* ... (restante do código sem alterações até o final) ... */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Informações do Cliente</CardTitle>
                        <EditClientInfoForm client={client} />
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start gap-2"><p className="font-semibold w-16">CNPJ:</p><p>{client.cnpj || "Não informado"}</p></div>
                        <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-1 text-muted-foreground" /><p>{client.address || "Não informado"}</p></div>
                        <div className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-1 text-muted-foreground" /><p><strong>Risco de Crédito:</strong> {client.credit_risk || "Não informado"}</p></div>
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
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Produtos Contratados</CardTitle></CardHeader>
                    <CardContent>
                        <AddContractForm clientId={client.id} />
                        <ul className="space-y-3 mt-4">
                        {client.contracts?.map((contract: any) => (
                          <li key={contract.id} className="flex items-center justify-between rounded-md border p-3">
                            <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span className="font-medium">{contract.name}</span>
                                <span className="text-xs text-muted-foreground">Início: {contract.start_date ? format(parseISO(contract.start_date), 'dd/MM/yyyy') : 'N/A'}</span>
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
                    <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico e CX</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between items-center"><span>Receita Mensal (MRR):</span> <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyRevenue)}</strong></div>
                        <div className="flex justify-between items-center"><span>Serviços Pontuais:</span> <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalServicesRevenue)}</strong></div>
                        <div className="flex justify-between items-center text-base"><strong>Valor Gerado (Total):</strong> <strong className="text-lg">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(generatedValue)}</strong></div>
                        <Separator />
                        <div className="flex justify-between items-center"><strong>Aniversário da Parceria:</strong> <span>{format(parseISO(firstContractDate), 'dd/MM/yyyy')}</span></div>
                        <div className="flex justify-between items-center"><strong>Vencimento do Próximo Contrato:</strong> <span>{furthestEndDate ? format(parseISO(furthestEndDate), 'dd/MM/yyyy') : 'Indeterminado'}</span></div>
                        <div className="flex justify-between items-center">
                            <strong>NPS Médio:</strong>
                            <div className="flex items-center gap-2">
                                <Badge variant={getNpsBadgeVariant(avgNps)}>{avgNps.toFixed(1)}</Badge>
                                {latestNpsScore !== undefined && (
                                    <>
                                        <span className="text-xs text-muted-foreground">(Último:</span>
                                        <Badge variant={getNpsBadgeVariant(latestNpsScore)} className="px-1.5 py-0">{latestNpsScore}</Badge>
                                        <span className="text-xs text-muted-foreground">)</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
             </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Dashboard de Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full">
                        <iframe
                            title="Looker Studio Dashboard"
                            width="100%"
                            height="100%"
                            src={LOOKER_STUDIO_URL}
                            frameBorder="0"
                            style={{ border: 0, borderRadius: "var(--radius)" }}
                            allowFullScreen
                            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-forms allow-popups"
                        ></iframe>
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
                         <CardHeader className="flex flex-row items-center justify-between">
                           <CardTitle>Serviços Pontuais</CardTitle>
                           <AddServiceForm clientId={client.id} />
                         </CardHeader>
                         <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                                <TableBody>
                                {client.one_time_services?.map((service: any) => (
                                    <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell>{format(parseISO(service.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell><ServiceStatusChanger service={{ id: service.id, status: service.status, clientId: client.id }} /></TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.value)}</TableCell>
                                    </TableRow>
                                ))}
                                {client.one_time_services?.length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum serviço pontual registrado.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                         </CardContent>
                       </Card>
                </TabsContent>
                <TabsContent value="nps">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Histórico de NPS</CardTitle>
                        <AddNpsForm clientId={client.id} />
                        </CardHeader>
                        <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {client.nps_responses?.map((response: NpsResponse, index: number) => ( // Tipando response aqui
                            <AccordionItem value={`item-${index}`} key={response.id}>
                                <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                    <span>Avaliação de {format(parseISO(response.response_date), 'dd/MM/yyyy')}</span>
                                    <Badge variant={getNpsBadgeVariant(response.score)}>
                                      Nota Geral: {response.score}/10
                                    </Badge>
                                </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                <div className="p-4 bg-muted/50 rounded-md">
                                    <h4 className="font-semibold mb-2">Notas por Categoria:</h4>
                                    {/* Verifica se category_scores existe e não está vazio */}
                                    {response.category_scores && Object.keys(response.category_scores).length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1 text-sm">
                                            {Object.entries(response.category_scores).map(([category, score]) => (
                                                <li key={category}>
                                                    <span className="font-medium">{category.replace(/_/g, ' ')}:</span> {String(score)}/10
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Nenhuma nota por categoria registrada para esta avaliação.</p>
                                    )}
                                    {/* Usa response.observations (se existir no seu tipo NpsResponse) */}
                                    {response.observations && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-1">Observações:</h4>
                                        <p className="text-sm text-muted-foreground italic">"{response.observations}"</p>
                                    </div>
                                    )}
                                    {/* Fallback para comment se observations não existir */}
                                     {!response.observations && response.comment && (
                                        <div className="mt-4">
                                            <h4 className="font-semibold mb-1">Observações (Comentário):</h4>
                                            <p className="text-sm text-muted-foreground italic">"{response.comment}"</p>
                                        </div>
                                    )}
                                </div>
                                </AccordionContent>
                            </AccordionItem>
                            ))}
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
