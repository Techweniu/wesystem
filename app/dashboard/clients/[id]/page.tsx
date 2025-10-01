import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notFound } from "next/navigation"
import { Mail, Phone, Calendar, Download, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddServiceForm } from "@/components/add-service-form"
import { AddNpsForm } from "@/components/add-nps-form"
import { AddContractForm } from "@/components/add-contract-form"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { format, parseISO } from 'date-fns'
import { EditClientForm } from "@/components/edit-client-form"
import { Button } from "@/components/ui/button"

async function getClientDetails(id: string) {
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from("clients")
    .select(`
      *, 
      contracts(*), 
      one_time_services(*), 
      nps_responses(*)
    `)
    .eq("id", id)
    .order('created_at', { foreignTable: 'contracts', ascending: false })
    .order('response_date', { foreignTable: 'nps_responses', ascending: false })
    .order('date', { foreignTable: 'one_time_services', ascending: false })
    .single()

  if (error) {
    console.error('Error fetching client details:', error);
    return null;
  }
  
  // Gerar URLs de download para os contratos
  if (client && client.contracts) {
    for (const contract of client.contracts) {
      const { data } = await supabase.storage.from('contracts').createSignedUrl(contract.storage_path, 60 * 60); // URL válida por 1 hora
      (contract as any).downloadUrl = data?.signedUrl;
    }
  }

  return client
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const client = await getClientDetails(id)

  if (!client) {
    notFound()
  }

  const monthlyRevenue = client.contracts?.reduce((sum: number, c: any) => sum + Number(c.valor_mensal), 0) || 0
  const completedServices = client.one_time_services?.filter((s: any) => s.status === "completed") || []
  const totalServicesRevenue = completedServices.reduce((sum: number, s: any) => sum + Number(s.value), 0) || 0
  
  const npsScores = client.nps_responses?.map((n: any) => n.score) || []
  const avgNps = npsScores.length > 0 ? npsScores.reduce((a: number, b: number) => a + b, 0) / npsScores.length : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
        <p className="text-muted-foreground">Detalhes do cliente e histórico</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Status</CardTitle></CardHeader><CardContent><Badge variant={client.status === "active" ? "default" : client.status === "prospect" ? "secondary" : "outline"}>{client.status === "active" ? "Ativo" : client.status === "prospect" ? "Prospect" : "Inativo"}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Receita Mensal (MRR)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyRevenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Serviços Pontuais</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalServicesRevenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">NPS Médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{avgNps.toFixed(1)}/10</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Informações de Contato</CardTitle>
          </div>
          <EditClientForm client={client} />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {client.contact_email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{client.contact_email}</span></div>}
          {client.contact_phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{client.contact_phone}</span></div>}
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Cliente desde {format(parseISO(client.created_at), 'dd/MM/yyyy')}</span></div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="services">Serviços Pontuais</TabsTrigger>
          <TabsTrigger value="nps">Histórico NPS</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos de Contrato</CardTitle>
              <AddContractForm clientId={client.id} />
            </CardHeader>
            <CardContent>
               <ul className="space-y-3">
                {client.contracts?.map((contract: any) => (
                  <li key={contract.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{contract.name}</span>
                        <span className="text-xs text-muted-foreground">Adicionado em: {format(parseISO(contract.created_at), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                    {contract.downloadUrl && (
                      <a href={contract.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Baixar
                        </Button>
                      </a>
                    )}
                  </li>
                ))}
                {client.contracts?.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground h-24 flex items-center justify-center">
                    Nenhum contrato foi adicionado a este cliente.
                  </div>
                )}
               </ul>
            </CardContent>
          </Card>
        </TabsContent>

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
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{format(parseISO(service.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={service.status === 'completed' ? 'default' : service.status === 'pending' ? 'secondary' : 'destructive'}>
                          {service.status === 'completed' ? 'Concluído' : service.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                   {client.one_time_services?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum serviço pontual registrado.
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
              <CardTitle>Histórico de NPS</CardTitle>
              <AddNpsForm clientId={client.id} />
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {client.nps_responses?.map((response: any, index: number) => (
                  <AccordionItem value={`item-${index}`} key={response.id}>
                    <AccordionTrigger>
                      <div className="flex justify-between items-center w-full pr-4">
                        <span>Avaliação de {format(parseISO(response.response_date), 'dd/MM/yyyy')}</span>
                        <Badge variant={response.score >= 9 ? "default" : response.score >= 7 ? "secondary" : "destructive"}>
                          Nota Geral: {response.score}/10
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 bg-muted/50 rounded-md">
                        <h4 className="font-semibold mb-2">Notas por Categoria:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {response.category_scores && Object.entries(response.category_scores).map(([category, score]) => (
                            <li key={category}>
                              <span className="font-medium">{category.replace(/_/g, ' ')}:</span> {String(score)}/10
                            </li>
                          ))}
                        </ul>
                        {response.observations && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-1">Observações:</h4>
                            <p className="text-sm text-muted-foreground italic">"{response.observations}"</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                 {client.nps_responses?.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground h-24 flex items-center justify-center">
                      Nenhuma avaliação NPS registrada.
                    </div>
                  )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
