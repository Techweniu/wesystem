// Caminho: wesystem10/app/dashboard/team/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EditEmployeeForm } from "@/components/edit-employee-form";
import { MarkPaymentButton } from "@/components/mark-payment-button";
import { AddEmployeeObservationForm } from "@/components/add-employee-observation-form";
import { AddEmployeeContractForm } from "@/components/add-employee-contract-form";
import { AddEmployeeContributionForm } from "@/components/add-employee-contribution-form";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Calendar,
  TrendingUp,
  Briefcase,
  ThumbsUp,
  ThumbsDown,
  Download,
  FileText,
  Award,
  Users as ClientIcon, // Renomeado para evitar conflito
  Video, // Adicionado ícone de Video
} from "lucide-react";
import { differenceInDays, parseISO, format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Label } from "@/components/ui/label";

// Função getEmployeeDetails - VERIFIQUE A LÓGICA DE BUSCA DE CLIENTES
async function getEmployeeDetails(id: string) {
  const supabase = await createClient();

  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select(`
      *,
      manager:manager_id ( name ),
      employee_payments ( * ),
      employee_observations ( * ),
      employee_contracts ( * ),
      employee_contributions ( * )
    `)
    .eq("id", id)
    .order('created_at', { foreignTable: 'employee_observations', ascending: false })
    .order('payment_date', { foreignTable: 'employee_payments', ascending: false })
    .order('created_at', { foreignTable: 'employee_contracts', ascending: false })
    .order('date', { foreignTable: 'employee_contributions', ascending: false })
    .maybeSingle();

  if (employeeError) {
    console.error("Erro ao buscar detalhes do colaborador:", employeeError);
  }
  if (!employeeData) {
      console.log(`Colaborador com ID ${id} não encontrado.`);
      return null;
  }

  // Busca clientes associados SE o cargo for Assessor ou Videomaker
  let assignedClients: { id: string; name: string }[] = [];
  if (employeeData.role === 'Assessor' || employeeData.role === 'Videomaker') {
    // Determina qual coluna filtrar na tabela 'clients'
    const columnToFilter = employeeData.role === 'Assessor' ? 'assigned_assessor_id' : 'assigned_videomaker_id';
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .eq(columnToFilter, id) // Filtra pelo ID do colaborador na coluna correta
      .eq('status', 'active') // Busca apenas clientes ativos
      .order('name');

    if (clientsError) {
        console.error(`Erro ao buscar clientes para ${employeeData.role}:`, clientsError);
    } else {
        assignedClients = clientsData || [];
    }
  }
  // --- FIM DA VERIFICAÇÃO DA LÓGICA ---

  // Gera URLs de contrato
  if (employeeData.employee_contracts) {
    for (const contract of employeeData.employee_contracts) {
      if (contract.storage_path) {
        const { data } = await supabase.storage.from('employee_contracts').createSignedUrl(contract.storage_path, 3600);
        (contract as any).downloadUrl = data?.signedUrl;
      }
    }
  }

  // Retorna os dados do colaborador + a lista de clientes atribuídos
  return { ...employeeData, assignedClients };
}

// Função getAllEmployees (sem alterações)
async function getAllEmployees() {
    const supabase = await createClient();
    const { data } = await supabase.from('employees').select('id, name, role').order('name');
    return data || [];
}

// Componente da Página
export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const [employeeDetails, allEmployees] = await Promise.all([
    getEmployeeDetails(params.id),
    getAllEmployees()
  ]);

  if (!employeeDetails) {
    notFound(); // Mostra 404 se colaborador não encontrado
  }

  // Separa assignedClients do resto dos dados do employee
  const { assignedClients, ...employee } = employeeDetails;

  // Cálculos (sem alterações)
  const today = new Date();
  const hireDate = parseISO(employee.hire_date);
  const totalCostGenerated = employee.salary ? (employee.salary / 30.44) * (differenceInDays(today, hireDate) > 0 ? differenceInDays(today, hireDate) : 0) : 0;
  const currentMonth = today.getMonth(); const currentYear = today.getFullYear();
  const isPaidThisMonth = employee.employee_payments.some(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });
  let nextPaymentDateFormatted = null;
  if(employee.payment_day) {
      let nextPaymentDate = new Date(currentYear, currentMonth, employee.payment_day);
      if (today.getTime() > nextPaymentDate.getTime()) { nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); }
      nextPaymentDateFormatted = format(nextPaymentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }
  const timeSinceHired = formatDistanceToNowStrict(hireDate, { locale: ptBR, addSuffix: false });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/team">Equipe</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{employee.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
          <p className="text-muted-foreground">{employee.role}</p>
        </div>
         <EditEmployeeForm employee={employee} allEmployees={allEmployees}>
            <Button variant="outline" size="sm">Editar</Button>
         </EditEmployeeForm>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status</CardTitle></CardHeader><CardContent><Badge variant={employee.status === "active" ? "default" : "outline"}>{employee.status === "active" ? "Ativo" : "Inativo"}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Custo Mensal (Salário)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(employee.salary || 0)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tempo de Casa</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{timeSinceHired}</div></CardContent></Card>
      </div>

      {/* Grid: Informações Gerais | Observações */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card de Informações Gerais */}
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                     <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Informações Gerais</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /><p>Cargo: {employee.role}</p></div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><p>Contratação: {format(hireDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p></div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><p>Email: {employee.email}</p></div>
                    {/* Exibe o departamento se existir */}
                    {employee.department && <div className="flex items-center gap-2"><ClientIcon className="h-4 w-4 text-muted-foreground" /><p>Departamento: {employee.department}</p></div>}
                    <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><p>Gestor Direto: {employee.manager?.name || "Nenhum"}</p></div>
                 </CardContent>
            </Card>
            {/* Card de Observações e Feedbacks */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Observações e Feedbacks</CardTitle>
                    <AddEmployeeObservationForm employeeId={employee.id} />
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {employee.employee_observations.length > 0 ? employee.employee_observations.map((obs) => (
                            <AccordionItem value={obs.id} key={obs.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between items-center w-full pr-4">
                                        <span className="text-sm">Observação de {format(parseISO(obs.created_at), "dd/MM/yyyy")}</span>
                                        {obs.tag === 'positive' ? (<div className="flex items-center gap-1.5 text-xs font-medium text-green-500"><ThumbsUp className="h-4 w-4" /> Positiva</div>)
                                        : (<div className="flex items-center gap-1.5 text-xs font-medium text-red-500"><ThumbsDown className="h-4 w-4" /> Negativa</div>)}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md whitespace-pre-wrap">{obs.observation}</p>
                                </AccordionContent>
                            </AccordionItem>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma observação registrada.</p>
                        )}
                    </Accordion>
                </CardContent>
            </Card>
       </div>

      {/* Card de Clientes Atribuídos (Condicional) - VERIFIQUE A EXIBIÇÃO */}
      {(employee.role === 'Assessor' || employee.role === 'Videomaker') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {/* Ícone apropriado para clientes */}
              <ClientIcon className="h-5 w-5" />
              Clientes Atribuídos ({assignedClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Verifica se a lista assignedClients tem itens */}
            {assignedClients.length > 0 ? (
              <ul className="space-y-2">
                {assignedClients.map((client) => (
                  <li key={client.id} className="text-sm">
                    {/* Link para a página do cliente */}
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-primary hover:underline"
                    >
                      {client.name} {/* Exibe o nome do cliente */}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum cliente ativo atribuído a este {employee.role.toLowerCase()}.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {/* --- FIM DA VERIFICAÇÃO --- */}

      {/* Card de Contribuições */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Contribuições</CardTitle>
            <AddEmployeeContributionForm employeeId={employee.id} />
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor Gerado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employee.employee_contributions.length > 0 ? employee.employee_contributions.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{format(parseISO(item.date), "dd/MM/yyyy")}</TableCell>
                            <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">
                                {item.value ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value) : "-"}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nenhuma contribuição registrada.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Card de Contratos do Colaborador */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contratos do Colaborador</CardTitle>
            <AddEmployeeContractForm employeeId={employee.id} />
        </CardHeader>
        <CardContent>
            <ul className="space-y-3">
                {employee.employee_contracts.length > 0 ? employee.employee_contracts.map((contract: any) => (
                    <li key={contract.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <span className="font-medium">{contract.name}</span>
                                <p className="text-xs text-muted-foreground">Adicionado em: {format(parseISO(contract.created_at), 'dd/MM/yyyy')}</p>
                            </div>
                        </div>
                        {contract.downloadUrl && (
                            <a href={contract.downloadUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Baixar</Button>
                            </a>
                        )}
                    </li>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum contrato adicionado.</p>
                )}
            </ul>
        </CardContent>
      </Card>

      {/* Card de Pagamentos */}
       <Card>
            <CardHeader><CardTitle>Pagamentos</CardTitle></CardHeader>
            <CardContent>
                 <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-semibold mb-3">Próximo Pagamento</h4>
                    {employee.payment_day ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div><p className="text-sm text-muted-foreground">Data Prevista</p><p className="font-medium">{nextPaymentDateFormatted}</p></div>
                            <div><p className="text-sm text-muted-foreground">Valor</p><p className="font-medium">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(employee.salary || 0)}</p></div>
                            <MarkPaymentButton employeeId={employee.id} salary={employee.salary || 0} isPaidThisMonth={isPaidThisMonth} />
                        </div>
                    ) : (<p className="text-sm text-muted-foreground text-center">O dia de pagamento ainda não foi definido.</p>)}
                 </div>
                 <Separator className="my-6" />
                 <h4 className="font-semibold mb-4">Histórico de Pagamentos</h4>
                 <Table>
                      <TableHeader>
                           <TableRow><TableHead>Data do Pagamento</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                          {employee.employee_payments.length > 0 ? employee.employee_payments.map((payment) => (
                              <TableRow key={payment.id}>
                                  <TableCell>{format(parseISO(payment.payment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</TableCell>
                                  <TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payment.amount)}</TableCell>
                              </TableRow>
                          )) : (
                              <TableRow><TableCell colSpan={2} className="h-24 text-center text-muted-foreground">Nenhum pagamento registrado.</TableCell></TableRow>
                          )}
                      </TableBody>
                 </Table>
            </CardContent>
       </Card>
    </div>
  );
}
