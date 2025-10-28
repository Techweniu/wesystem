// Caminho: wesystem10/app/dashboard/clients/[id]/page.tsx
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notFound } from "next/navigation"
import {
  Mail,
  Phone,
  Download,
  FileText,
  Building,
  MapPin,
  AlertTriangle,
  Star,
  History,
  BarChart2,
  ThumbsDown,
  BlendIcon as ClientIcon,
  Video,
} from "lucide-react" // Users as ClientIcon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddServiceForm } from "@/components/add-service-form"
import { AddNpsForm } from "@/components/add-nps-form"
import { AddContractForm } from "@/components/add-contract-form"
import { EditContractForm } from "@/components/edit-contract-form"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { format, parseISO, differenceInDays, isPast, formatDistanceToNowStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import { EditClientInfoForm } from "@/components/edit-client-info-form"
import { EditClientNotesForm } from "@/components/edit-client-notes-form"
import { Button } from "@/components/ui/button"
import { ServiceStatusChanger } from "@/components/service-status-changer"
import { Separator } from "@/components/ui/separator"
import { ClientContactsManager } from "@/components/client-contacts-manager"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Label } from "@/components/ui/label"

const LOOKER_STUDIO_URL =
  "https://lookerstudio.google.com/embed/reporting/dd2d13f5-60b6-4926-ba5d-afe9db7dbcd1/page/jCyaF"

// Interfaces
interface NpsCategoryScores {
  [key: string]: number
}
interface NpsResponse {
  id: string
  client_id: string
  score: number
  comment: string | null
  response_date: string
  created_at: string
  category_scores: NpsCategoryScores | null
  observations: string | null
}
type ClientDetails = Awaited<ReturnType<typeof getClientDetails>>

// Função getClientDetails - VERIFIQUE O SELECT
async function getClientDetails(id: string) {
  const supabase = await createClient()
  const { data: clientData, error: clientError } = await supabase
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
      assigned_videomaker:assigned_videomaker_id ( id, name ),
      assigned_relationship_manager:assigned_relationship_manager_id ( id, name )
    `) // Garante que os joins estão corretos
    .eq("id", id)
    .order("created_at", { foreignTable: "contracts", ascending: false })
    .order("response_date", { foreignTable: "nps_responses", ascending: false })
    .order("date", { foreignTable: "one_time_services", ascending: false })
    .maybeSingle()

  if (clientError || !clientData) {
    console.error("Erro ao buscar detalhes do cliente:", clientError)
    return null
  }

  // Gera URLs de download para contratos
  if (clientData.contracts) {
    for (const contract of clientData.contracts) {
      if (contract.storage_path) {
        const { data: urlData } = await supabase.storage.from("contracts").createSignedUrl(contract.storage_path, 3600) // URL válida por 1 hora
        ;(contract as any).downloadUrl = urlData?.signedUrl
      }
    }
  }

  // Busca potenciais assessores, videomakers e gestores de relacionamento
  const { data: potentialAssessors } = await supabase
    .from("employees")
    .select("id, name")
    .eq("status", "active")
    .eq("role", "Assessor")
    .order("name")
  const { data: potentialVideomakers } = await supabase
    .from("employees")
    .select("id, name")
    .eq("status", "active")
    .eq("role", "Videomaker")
    .order("name")
  const { data: potentialManagers } = await supabase
    .from("employees")
    .select("id, name")
    .eq("status", "active")
    .eq("role", "Gestor de Relacionamento")
    .order("name")

  return {
    ...clientData,
    potentialAssessors: potentialAssessors || [],
    potentialVideomakers: potentialVideomakers || [],
    potentialManagers: potentialManagers || [],
  }
}
// --- FIM DA VERIFICAÇÃO ---

// Funções auxiliares isContractVigent e getNpsBadgeVariant
const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date()
  const hasStarted = contract.start_date
    ? !isPast(parseISO(contract.start_date)) ||
      format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true
  return hasStarted && hasNotEnded
}

const getNpsBadgeVariant = (nps: number | undefined): "destructive" | "secondary" | "default" | "outline" => {
  if (nps === undefined) return "outline"
  if (nps <= 7) return "destructive" // Ajustado para 0-7
  if (nps === 8) return "secondary"
  return "default"
}

// Componente da Página
export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const clientData = await getClientDetails(id)

  if (!clientData) {
    notFound()
  } // Se getClientDetails retornou null, mostra 404
  const { potentialAssessors, potentialVideomakers, potentialManagers, ...client } = clientData

  const today = new Date()

  // Cálculos de Receita, NPS, Valor Gerado, Tempo de Parceria
  const monthlyRevenue =
    client.contracts
      ?.filter((c) => c.status === "active" && isContractVigent(c))
      .reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0
  const completedServices = client.one_time_services?.filter((s: any) => s.status === "completed") || []
  const totalServicesRevenue = completedServices.reduce((sum, s: any) => sum + Number(s.value), 0) || 0
  const npsScores = client.nps_responses?.map((n: any) => n.score) || []
  const avgNps = npsScores.length > 0 ? npsScores.reduce((a: number, b: number) => a + b, 0) / npsScores.length : 0
  const latestNpsResponse = client.nps_responses?.[0] as NpsResponse | undefined
  const latestNpsScore = latestNpsResponse?.score
  let worstNpsCategories: { category: string; score: number }[] = []
  if (latestNpsResponse?.category_scores) {
    worstNpsCategories = Object.entries(latestNpsResponse.category_scores)
      .map(([category, score]) => ({ category: category.replace(/_/g, " "), score }))
      .filter((item) => item.score < 8)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
  }
  let generatedValue = 0
  client.contracts?.forEach((contract) => {
    if (contract.start_date && contract.valor_mensal && contract.valor_mensal > 0) {
      const startDate = parseISO(contract.start_date)
      const daysPassed = Math.max(0, differenceInDays(today, startDate) + 1)
      generatedValue += (contract.valor_mensal / 30.44) * daysPassed
    }
  })
  generatedValue += totalServicesRevenue
  let firstContractDate = client.created_at
  let furthestEndDate: string | null = null
  const activeContracts = client.contracts?.filter((c) => c.status === "active" && isContractVigent(c))
  if (activeContracts && activeContracts.length > 0) {
    const earliestStartDate = activeContracts
      .filter((c) => c.start_date)
      .reduce((earliest, current) =>
        parseISO(current.start_date!) < parseISO(earliest.start_date!) ? current : earliest,
      ).start_date
    if (earliestStartDate) firstContractDate = earliestStartDate
    const contractsWithEndDate = activeContracts.filter((c) => c.end_date)
    if (contractsWithEndDate.length > 0) {
      furthestEndDate = contractsWithEndDate.reduce((furthest, current) =>
        parseISO(current.end_date!) > parseISO(furthest.end_date!) ? current : furthest,
      ).end_date
    }
  }
  const partnershipTime = firstContractDate
    ? formatDistanceToNowStrict(parseISO(firstContractDate), { locale: ptBR })
    : "-"

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
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

      {/* Cabeçalho com Nome e Botão Editar */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">Central de Informações do Cliente</p>
        </div>
        <EditClientInfoForm
          client={client}
          assessors={potentialAssessors}
          videomakers={potentialVideomakers}
          relationshipManagers={potentialManagers}
        />
      </div>

      {/* Grid de Cards Resumo */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={client.status === "active" ? "default" : "outline"}>
                {client.status === "active" ? "Ativo" : client.status === "prospect" ? "Prospect" : "Inativo"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saúde</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  client.health_status === "red"
                    ? "destructive"
                    : client.health_status === "yellow"
                      ? "secondary"
                      : "default"
                }
              >
                {client.health_status === "red"
                  ? "🔴 Crítico"
                  : client.health_status === "yellow"
                    ? "🟡 Atenção"
                    : "🟢 Bom"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Último NPS</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getNpsBadgeVariant(latestNpsScore)}>{latestNpsScore ?? "-"}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyRevenue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Tráfego Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-5 w-5 text-blue-500" /> Status do Tráfego Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground">Possui Tráfego?</Label>
              <p>{client.has_traffic_service ? "Sim" : "Não"}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground">Conta Organizada?</Label>
              <p>{client.ad_account_organized ? "Sim" : "Não"}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground">Anúncios Rodando?</Label>
              <p>{client.ads_running ? "Sim" : "Não"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Responsáveis Atribuídos - VERIFIQUE A EXIBIÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClientIcon className="h-5 w-5 text-indigo-500" /> Responsáveis Atribuídos
            </CardTitle>
            <CardDescription>Assessor, Videomaker e Gestor de Relacionamento principais.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground flex items-center gap-1">
                <ClientIcon className="h-4 w-4" /> Assessor
              </Label>
              <p>{client.assigned_assessor?.name ?? <span className="text-muted-foreground italic">Nenhum</span>}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Video className="h-4 w-4" /> Videomaker
              </Label>
              <p>{client.assigned_videomaker?.name ?? <span className="text-muted-foreground italic">Nenhum</span>}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <Label className="text-muted-foreground flex items-center gap-1">
                <ClientIcon className="h-4 w-4" /> Gestor de Relacionamento
              </Label>
              <p>
                {client.assigned_relationship_manager?.name ?? (
                  <span className="text-muted-foreground italic">Nenhum</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        {/* --- FIM DA VERIFICAÇÃO --- */}

        {/* Grid: Infos Cliente | Notas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-5 w-5" /> Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.cnpj && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p>CNPJ: {client.cnpj}</p>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p>Endereço: {client.address}</p>
                </div>
              )}
              {client.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>Email: {client.contact_email}</p>
                </div>
              )}
              {client.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>Telefone: {client.contact_phone}</p>
                </div>
              )}
              {client.credit_risk && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <p>Risco de Crédito: {client.credit_risk}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-5 w-5" /> Notas e Objetivos
              </CardTitle>
              <EditClientNotesForm client={client} />
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Nota do Cliente</Label>
                <p className="whitespace-pre-wrap">
                  {client.client_notes || <span className="italic">Nenhuma nota.</span>}
                </p>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">Objetivos com a Parceria</Label>
                <p className="whitespace-pre-wrap">
                  {client.objectives || <span className="italic">Nenhum objetivo.</span>}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid: Contatos | Contratos | Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ClientContactsManager clientId={client.id} contacts={client.client_contacts || []} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Contratos
              </CardTitle>
              <AddContractForm clientId={client.id} />
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {client.contracts?.map((contract: any) => (
                  <li key={contract.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{contract.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Início: {format(parseISO(contract.start_date), "dd/MM/yy")}{" "}
                          {contract.end_date ? `- Fim: ${format(parseISO(contract.end_date), "dd/MM/yy")}` : ""}
                        </span>
                        <Badge variant={contract.status === "active" ? "default" : "outline"} className="mt-1">
                          {contract.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {contract.downloadUrl && (
                        <a href={contract.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <EditContractForm contract={contract} />
                    </div>
                  </li>
                ))}
                {client.contracts?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum contrato.</p>
                )}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> Histórico e Valor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-col space-y-1">
                <Label className="text-muted-foreground">Tempo de Parceria</Label>
                <p>{partnershipTime}</p>
              </div>
              <div className="flex flex-col space-y-1">
                <Label className="text-muted-foreground">Valor Gerado (Est.)</Label>
                <p className="font-semibold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(generatedValue)}
                </p>
              </div>
              <div className="flex flex-col space-y-1">
                <Label className="text-muted-foreground">Próximo Término</Label>
                <p>
                  {furthestEndDate ? (
                    format(parseISO(furthestEndDate), "dd/MM/yyyy")
                  ) : (
                    <span className="italic">Indeterminado</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Dashboard Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard de Resultados</CardTitle>
            <CardDescription>Visualize o desempenho das campanhas.</CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              title={`Dashboard ${client.name}`}
              width="100%"
              height="600"
              src={LOOKER_STUDIO_URL}
              frameBorder="0"
              style={{ border: 0 }}
              allowFullScreen
            ></iframe>
          </CardContent>
        </Card>

        {/* Abas Serviços e NPS */}
        <Tabs defaultValue="services" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services">Serviços Pontuais</TabsTrigger>
            <TabsTrigger value="nps">Avaliações NPS</TabsTrigger>
          </TabsList>
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Serviços Pontuais</CardTitle>
                <AddServiceForm clientId={client.id} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.one_time_services?.map((service: any) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{format(parseISO(service.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <ServiceStatusChanger
                            service={{ id: service.id, clientId: client.id, status: service.status }}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {client.one_time_services?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum serviço.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="nps">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Avaliações NPS</CardTitle>
                <AddNpsForm clientId={client.id} />
              </CardHeader>
              <CardContent>
                {latestNpsResponse && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-semibold mb-2">
                      Última ({format(parseISO(latestNpsResponse.response_date), "dd/MM/yyyy")}) - Nota:{" "}
                      <Badge variant={getNpsBadgeVariant(latestNpsScore)}>{latestNpsScore}</Badge>
                    </h4>
                    {worstNpsCategories.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-destructive flex items-center gap-1">
                          <ThumbsDown className="h-4 w-4" /> Pontos de Atenção:
                        </p>
                        <ul className="list-disc list-inside text-sm text-destructive/90">
                          {worstNpsCategories.map((item) => (
                            <li key={item.category}>
                              {item.category} ({item.score})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {latestNpsResponse.observations && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Observações:</span> {latestNpsResponse.observations}
                      </p>
                    )}
                  </div>
                )}
                <Accordion type="single" collapsible className="w-full">
                  {client.nps_responses?.map((nps: NpsResponse) => (
                    <AccordionItem value={nps.id} key={nps.id}>
                      <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4 text-sm">
                          <span>Avaliação de {format(parseISO(nps.response_date), "dd/MM/yyyy")}</span>
                          <Badge variant={getNpsBadgeVariant(nps.score)}>{nps.score}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          <h5 className="font-semibold text-xs mb-1">Notas por Categoria:</h5>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {nps.category_scores &&
                              Object.entries(nps.category_scores).map(([cat, score]) => (
                                <li key={cat}>
                                  {cat.replace(/_/g, " ")}: {score}
                                </li>
                              ))}
                          </ul>
                          {nps.observations && (
                            <p className="text-xs mt-2">
                              <span className="font-medium">Observações:</span> {nps.observations}
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {client.nps_responses?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação NPS.</p>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
