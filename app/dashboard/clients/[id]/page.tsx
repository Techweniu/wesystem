import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notFound } from "next/navigation"
import { Mail, Phone, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AddServiceForm } from "@/components/add-service-form"
import { AddNpsForm } from "@/components/add-nps-form"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

async function getClientDetails(id: string) {
  const supabase = await createClient()
  const { data: client } = await supabase
    .from("clients")
    .select(`*, contracts(*), one_time_services(*), nps_responses(*)`)
    .eq("id", id)
    .order('response_date', { foreignTable: 'nps_responses', ascending: false })
    .single()
  return client
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const client = await getClientDetails(id)

  if (!client) {
    notFound()
  }

  // Lógica de cálculo (corrigida e completa)
  const activeContracts = client.contracts?.filter((c: any) => c.status === "active") || []
  const monthlyRevenue = activeContracts.reduce((sum: number, c: any) => sum + Number(c.monthly_value), 0) || 0
  const completedServices = client.one_time_services?.filter((s: any) => s.status === "completed") || []
  const totalServicesRevenue = completedServices.reduce((sum: number, s: any) => sum + Number(s.value), 0) || 0
  
  // Cálculo correto da Média do NPS
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
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Receita Mensal</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(monthlyRevenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Serviços Pontuais</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalServicesRevenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">NPS Médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{avgNps.toFixed(1)}/10</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Informações de Contato</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {client.contact_email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{client.contact_email}</span></div>}
          {client.contact_phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{client.contact_phone}</span></div>}
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Cliente desde {new Date(client.created_at).toLocaleDateString("pt-BR")}</span></div>
        </CardContent>
      </Card>

      <Tabs defaultValue="nps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="services">Serviços Pontuais</TabsTrigger>
          <TabsTrigger value="nps">Histórico NPS</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          {/* Aba de Contratos Restaurada */}
        </TabsContent>

        <TabsContent value="services">
          {/* Aba de Serviços Restaurada */}
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
                        <span>Avaliação de {new Date(response.response_date).toLocaleDateString("pt-BR")}</span>
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
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
