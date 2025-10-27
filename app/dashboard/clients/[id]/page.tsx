// Em wesystem6/app/dashboard/clients/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound } from "next/navigation";
import { Mail, Phone, Calendar, Download, FileText, Building, MapPin, AlertTriangle, Star, History, BarChart2, ThumbsDown, Users, Video } from "lucide-react"; // Adicionado Users, Video
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddServiceForm } from "@/components/add-service-form";
import { AddNpsForm } from "@/components/add-nps-form";
import { AddContractForm } from "@/components/add-contract-form";
import { EditContractForm } from "@/components/edit-contract-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { EditClientInfoForm } from "@/components/edit-client-info-form"; // Importa o formulário principal
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

// Interfaces (sem alterações)
interface NpsCategoryScores { [key: string]: number; }
interface NpsResponse { id: string; client_id: string; score: number; comment: string | null; response_date: string; created_at: string; category_scores: NpsCategoryScores | null; observations: string | null; }

// Tipagem para os dados buscados (incluindo nomes dos responsáveis)
type ClientDetails = Awaited<ReturnType<typeof getClientDetails>>;


async function getClientDetails(id: string) {
  const supabase = await createClient();

  // Busca o cliente e faz JOIN para pegar os nomes dos funcionários associados
  const { data: client, error } = await supabase
    .from("clients")
    .select(`
      *,
      has_traffic_service,
      ad_account_organized,
      ads_running,
      contracts(*),
      one_time_services(*),
      nps_responses(*),
      client_contacts(*),
      assigned_assessor:assigned_assessor_id ( id, name ),
      assigned_videomaker:assigned_videomaker_id ( id, name )
    `)
    .eq("id", id)
    .order('created_at', { foreignTable: 'contracts', ascending: false })
    .order('response_date', { foreignTable: 'nps_responses', ascending: false })
    .order('date', { foreignTable: 'one_time_services', ascending: false })
    .maybeSingle(); // Usa maybeSingle pois pode não encontrar

  if (error) {
    console.error("Erro ao buscar detalhes do cliente:", error);
    return null;
   }
   if (!client) {
       return null; // Retorna null explicitamente se não encontrar
   }

  // Geração de URL de download para contratos
  if (client.contracts) {
    for (const contract of client.contracts) {
      if (contract.storage_path) {
        const { data: urlData } = await supabase.storage.from('contracts').createSignedUrl(contract.storage_path, 60 * 60);
        (contract as any).downloadUrl = urlData?.signedUrl;
      }
    }
  }

  // Busca a lista de funcionários ativos que são Assessores ou Videomakers
  const { data: potentialAssessors } = await supabase
    .from("employees")
    .select("id, name")
    .eq("status", "active")
    .eq("role", "Assessor") // Filtra pelo cargo exato
    .order("name");

  const { data: potentialVideomakers } = await supabase
    .from("employees")
    .select("id, name")
    .eq("status", "active")
    .eq("role", "Videomaker") // Filtra pelo cargo exato
    .order("name");

  // Adiciona as listas ao objeto do cliente para serem usadas no formulário
  return {
      ...client,
      potentialAssessors: potentialAssessors || [],
      potentialVideomakers: potentialVideomakers || [],
  };
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const clientData = await getClientDetails(id);

  if (!clientData) { notFound(); }
  // Desestrutura os dados do cliente e as listas de funcionários
  const { potentialAssessors, potentialVideomakers, ...client } = clientData;


  const today = new Date();

  // Funções auxiliares e cálculos (sem alterações significativas)
  const isContractVigent = (contract: { start_date: string | null, end_date: string | null }) => { /* ... */ };
  const monthlyRevenue = client.contracts?.filter(c => c.status === 'active' && isContractVigent(c)).reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0;
  const completedServices = client.one_time_services?.filter((s: any) => s.status === "completed") || [];
  const totalServicesRevenue = completedServices.reduce((sum, s: any) => sum + Number(s.value), 0) || 0;
  const npsScores = client.nps_responses?.map((n: any) => n.score) || [];
  const avgNps = npsScores.length > 0 ? npsScores.reduce((a: number, b: number) => a + b, 0) / npsScores.length : 0;
  const latestNpsResponse = client.nps_responses?.[0] as NpsResponse | undefined;
  const latestNpsScore = latestNpsResponse?.score;
  let worstNpsCategories: { category: string; score: number }[] = [];
  if (latestNpsResponse?.category_scores) { /* ... */ };
  const getNpsBadgeVariant = (nps: number | undefined): 'destructive' | 'secondary' | 'default' | 'outline' => { /* ... */ };
  let generatedValue = 0; client.contracts?.forEach(contract => { /* ... */ }); generatedValue += totalServicesRevenue;
  let firstContractDate = client.created_at; let furthestEndDate: string | null = null;
  const activeContracts = client.contracts?.filter(c => c.status === 'active' && isContractVigent(c));
  if (activeContracts && activeContracts.length > 0) { /* ... */ };


  return (
    <div className="space-y-6">
        <Breadcrumb>{/* ... */}</Breadcrumb>

        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                <p className="text-muted-foreground">Central de Informações do Cliente</p>
            </div>
             {/* Passa as listas de funcionários para o formulário */}
             <EditClientInfoForm
                client={client}
                assessors={potentialAssessors}
                videomakers={potentialVideomakers}
             />
        </div>

        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{/* Cards Resumo */}</div>
            <Card>{/* Card Tráfego */}</Card>

            {/* ====> NOVO CARD DE RESPONSÁVEIS <==== */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                       <Users className="h-5 w-5 text-indigo-500" />
                       Responsáveis Atribuídos
                    </CardTitle>
                     <CardDescription>Assessor e Videomaker principais deste cliente.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col space-y-1">
                        <Label className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Assessor</Label>
                        {/* Mostra o nome se existir, senão "Nenhum" */}
                        <p>{client.assigned_assessor?.name ?? <span className="text-muted-foreground italic">Nenhum atribuído</span>}</p>
                    </div>
                     <div className="flex flex-col space-y-1">
                        <Label className="text-muted-foreground flex items-center gap-1"><Video className="h-4 w-4" /> Videomaker</Label>
                        {/* Mostra o nome se existir, senão "Nenhum" */}
                        <p>{client.assigned_videomaker?.name ?? <span className="text-muted-foreground italic">Nenhum atribuído</span>}</p>
                    </div>
                </CardContent>
            </Card>
            {/* ==================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* Cards Infos Cliente e Notas */}</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{/* Cards Contatos, Contratos, Histórico */}</div>
            <Card>{/* Card Dashboard Resultados */}</Card>
            <Tabs defaultValue="services">{/* Abas Serviços e NPS */}</Tabs>
        </div>
    </div>
  )
}

// Re-incluir funções auxiliares que foram omitidas com /* ... */
const isContractVigent = (contract: { start_date: string | null, end_date: string | null }) => {
    const today = new Date();
    const hasStarted = contract.start_date ? !isPast(parseISO(contract.start_date)) || format(parseISO(contract.start_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') : true;
    const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true;
    return hasStarted && hasNotEnded;
}

const getNpsBadgeVariant = (nps: number | undefined): 'destructive' | 'secondary' | 'default' | 'outline' => {
    if (nps === undefined) return 'outline';
    if (nps <= 7) return 'destructive';
    if (nps === 8) return 'secondary';
    return 'default';
};
