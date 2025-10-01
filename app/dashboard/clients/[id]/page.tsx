import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notFound } from "next/navigation"
import { Mail, Phone, Calendar, LinkIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AddServiceForm } from "@/components/add-service-form"
import { Input } from "@/components/ui/input"

async function getClientDetails(id: string) {
  const supabase = await createClient()
  const { data: client } = await supabase
    .from("clients")
    .select(
      `
      *,
      contracts (*),
      one_time_services (*),
      nps_responses (*)
    `,
    )
    .eq("id", id)
    .single()

  return client
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const client = await getClientDetails(id)

  if (!client) {
    notFound()
  }

  const activeContracts = client.contracts?.filter((c: { status: string }) => c.status === "active") || []
  const monthlyRevenue =
    activeContracts.reduce((sum: number, c: { monthly_value: number }) => sum + Number(c.monthly_value), 0) || 0

  const completedServices = client.one_time_services?.filter((s: { status: string }) => s.status === "completed") || []
  const totalServicesRevenue =
    completedServices.reduce((sum: number, s: { value: number }) => sum + Number(s.value), 0) || 0

  const npsScores = client.nps_responses?.map((n: { score: number }) => n.score) || []
  const avgNps = npsScores.length > 0 ? npsScores.reduce((a: number, b: number) => a + b, 0) / npsScores.length : 0

  // ATENÇÃO: A URL base pode precisar ser ajustada para o seu domínio de produção
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  const npsLink = `${baseUrl}/nps/${client.id}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
        <p className="text-muted-foreground">Detalhes do cliente e histórico</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={client.status === "active" ? "default" : client.status === "prospect" ? "secondary" : "outline"}
            >
              {client.status === "active" ? "Ativo" : client.status === "prospect" ? "Prospect" : "Inativo"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(monthlyRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Serviços Pontuais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalServicesRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">NPS Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgNps)}/10</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.contact_email}</span>
            </div>
          )}
          {client.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.contact_phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Cliente desde {new Date(client.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card do Link do NPS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Link para Formulário NPS</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">Envie este link para o cliente preencher a avaliação de satisfação a qualquer momento.</p>
          <Input readOnly defaultValue={npsLink} />
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
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim</TableHead>
                    <TableHead>Tempo Restante</TableHead>
                    <TableHead className="text-right">Valor Mensal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.contracts?.map((contract: any) => {
                    let remainingTime = "Indeterminado";
                    let isExpired = false;
                    if (contract.end_date) {
                      const endDate = new Date(contract.end_date);
                      isExpired = isPast(endDate);
                      remainingTime = formatDistanceToNow(endDate, { addSuffix: true, locale: ptBR });
                    }
                    return (
                      <TableRow key={contract.id}>
                        <TableCell><Badge variant={contract.status === "active" ? "default" : "outline"}>{contract.status === "active" ? "Ativo" : "Encerrado"}</Badge></TableCell>
                        <TableCell>{new Date(contract.start_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{contract.end_date ? new Date(contract.end_date).toLocaleDateString("pt-BR") : "N/A"}</TableCell>
                        <TableCell className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>{remainingTime}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(contract.monthly_value)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.one_time_services?.map((service: any) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell><Badge variant={service.status === "completed" ? "default" : service.status === "pending" ? "secondary" : "outline"}>{service.status === "completed" ? "Concluído" : service.status === "pending" ? "Pendente" : "Cancelado"}</Badge></TableCell>
                      <TableCell>{new Date(service.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nps">
           <Card>
            <CardHeader>
              <CardTitle>Histórico de NPS</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Comentário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.nps_responses?.map((response: any) => (
                    <TableRow key={response.id}>
                      <TableCell>{new Date(response.response_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge
                          variant={response.score >= 9 ? "default" : response.score >= 7 ? "secondary" : "destructive"}
                        >
                          {response.score}/10
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">{response.comment || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
