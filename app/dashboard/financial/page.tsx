// sistema/app/dashboard/financial/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Users } from "lucide-react"; // Adicionado ícone Users
import { AddCostDialog } from "@/components/add-cost-dialog";
import { FinancialTable } from "@/components/financial-table";
import { FinancialCharts } from "@/components/financial-charts";
import { PeriodSelector } from "@/components/period-selector";
import { ClientPaymentsTable } from "@/components/client-payments-table"; // Importar o novo componente
import { parseISO, format, startOfMonth, endOfMonth, differenceInDays, isPast, addMonths } from "date-fns"; // Funções adicionadas de date-fns
import { ptBR } from "date-fns/locale";

// Função auxiliar (pode ser movida para utils se necessário)
const isContractVigent = (contract: { start_date: string | null; end_date: string | null }) => {
  const today = new Date();
  // Verifica se a data de início já passou ou é hoje
  const hasStarted = contract.start_date
    ? isPast(parseISO(contract.start_date)) || format(parseISO(contract.start_date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    : true; // Se não tem data de início, considera que começou
  // Verifica se a data de fim ainda não passou
  const hasNotEnded = contract.end_date ? !isPast(parseISO(contract.end_date)) : true; // Se não tem data de fim, considera que não terminou
  return hasStarted && hasNotEnded;
};


async function getFinancialData(period = "month") {
  const supabase = await createClient();
  const today = new Date();
  const currentMonth = today.getMonth(); // Mês atual (0-11)
  const currentYear = today.getFullYear(); // Ano atual

  // --- Cálculo do Intervalo de Datas (sem alteração aqui) ---
  let startDate: Date;
  // ... (resto do cálculo de data permanece igual)
  switch (period) {
    case "week":
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      break;
    case "month":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "quarter":
      startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      break;
    case "year":
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    default: // Padrão é 'month'
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  const startDateStr = startDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD
  // --- Fim do Cálculo do Intervalo de Datas ---

  // --- Busca de Dados Existentes (sem grandes alterações aqui) ---
  // Busca serviços pontuais dentro do período
  const { data: services } = await supabase
    .from("one_time_services")
    .select("*, clients(name)") // Inclui o nome do cliente
    .gte("date", startDateStr) // Maior ou igual à data de início
    .order("date", { ascending: false }); // Ordena pelos mais recentes

  // Busca custos dentro do período
  const { data: costs } = await supabase
    .from("costs")
    .select("*")
    .gte("date", startDateStr)
    .order("date", { ascending: false });

  // Busca funcionários ativos (para cálculo de salários)
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, salary")
    .eq("status", "active") // Apenas ativos
    .order("name");
  // --- Fim da Busca de Dados Existentes ---


  // --- NOVO: Busca de Dados de Pagamento de Clientes ---
  const { data: clientsWithContracts } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      status,
      contracts (id, name, valor_mensal, start_date, end_date, status),
      client_payments (amount, payment_date, contract_id)
    `)
    .eq("status", "active") // Apenas clientes ativos
    .order("name"); // Ordena por nome

  // Processa os dados dos clientes para a tabela de pagamentos
  const clientPayments = clientsWithContracts?.map(client => {
    // Filtra contratos ativos e vigentes
    const activeContracts = client.contracts.filter(c => c.status === 'active' && isContractVigent(c));
    // Soma o valor mensal dos contratos ativos/vigentes
    const expectedMonthlyPayment = activeContracts.reduce((sum, c) => sum + Number(c.valor_mensal || 0), 0);

    // Verifica se há um pagamento registrado neste mês/ano
    const paymentThisMonth = client.client_payments.find(p => {
      const paymentDate = parseISO(p.payment_date); // Converte string para data
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });
    const isPaidThisMonth = !!paymentThisMonth; // True se encontrou pagamento, false senão

    // Determina a próxima data de pagamento (simplificado: assume pagamento mensal no dia 1 após o início do contrato)
    // Lógica mais complexa seria necessária para dias de pagamento específicos por cliente/contrato
    let nextPaymentDateFormatted = null;
    let paymentDay = 1; // Assumindo dia 1 para simplificar
    if (activeContracts.length > 0) {
        let nextPaymentDate = new Date(currentYear, currentMonth, paymentDay);

        // Se hoje já passou do dia de pagamento e ainda não foi pago, o próximo é no mês seguinte
        if (today.getDate() > paymentDay && !isPaidThisMonth) {
             nextPaymentDate = addMonths(nextPaymentDate, 1);
        } else if (isPaidThisMonth) {
             // Se já foi pago este mês, o próximo é no mês seguinte
             nextPaymentDate = addMonths(nextPaymentDate, 1);
        }
         // Poderia adicionar lógica para garantir que a data de pagamento não seja antes do início do contrato, mas mantendo simples por agora.


        nextPaymentDateFormatted = format(nextPaymentDate, "dd/MM/yyyy", { locale: ptBR }); // Formata a data
    }

    return {
      clientId: client.id,
      clientName: client.name,
      expectedAmount: expectedMonthlyPayment, // Valor esperado baseado nos contratos ativos
      isPaidThisMonth: isPaidThisMonth, // Status do pagamento neste mês
      nextPaymentDate: nextPaymentDateFormatted, // Data formatada do próximo vencimento
      // Passa os contratos ativos caso precise vincular pagamento a um contrato específico no futuro
      activeContracts: activeContracts.map(c => ({id: c.id, name: c.name})),
    };
  }).filter(p => p.expectedAmount > 0) // Mostra apenas clientes com valor mensal > 0
  .sort((a,b) => a.clientName.localeCompare(b.clientName)); // Ordena por nome do cliente
  // --- FIM NOVO: Busca de Dados de Pagamento de Clientes ---


  // --- Cálculo de Totais (sem alteração aqui) ---
  const completedServices = services?.filter((s) => s.status === "completed") || [];
  const servicesRevenue = completedServices.reduce((sum, s) => sum + Number(s.value), 0);

  const totalCosts = costs?.reduce((sum, c) => sum + Number(c.value), 0) || 0;

  // Calcula custos por categoria
  const costsByCategory: Record<string, number> = {};
  costs?.forEach((cost) => {
    const category = cost.category || "Outros"; // Agrupa custos sem categoria em "Outros"
    costsByCategory[category] = (costsByCategory[category] || 0) + Number(cost.value);
  });

  // Calcula total de salários dos funcionários ativos
  const totalSalaries = employees?.reduce((sum, e) => sum + Number(e.salary || 0), 0) || 0;

  // Receita total considerada (aqui, apenas serviços pontuais - ajuste se incluir MRR)
  const totalRevenue = servicesRevenue;
  // Lucro (Receita - Custos)
  const profit = totalRevenue - totalCosts;
  // --- Fim do Cálculo de Totais ---

  return {
    services, // Lista de serviços pontuais
    costs, // Lista de custos
    employees: employees || [], // Lista de funcionários
    servicesRevenue, // Receita total de serviços pontuais no período
    totalRevenue, // Receita total (ajuste se incluir MRR)
    totalCosts, // Custo total no período
    costsByCategory, // Custos agrupados por categoria
    totalSalaries, // Soma dos salários dos ativos
    profit, // Lucro (Receita - Custos)
    period, // Período selecionado ('month', 'week', etc.)
    clientPayments: clientPayments || [], // Adiciona os dados de pagamento dos clientes ao retorno
  };
}

// Componente principal da página
export default async function FinancialPage({
  searchParams,
}: {
  searchParams: { period?: string }; // Define o tipo dos parâmetros de busca
}) {
  const period = searchParams.period || "month"; // Pega o período da URL ou usa 'month' como padrão
  const data = await getFinancialData(period); // Busca os dados financeiros

  return (
    <div className="space-y-6"> {/* Espaçamento entre os elementos */}
      {/* Cabeçalho da página e botões de ação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gestão completa de receitas e custos</p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector currentPeriod={period} /> {/* Seletor de período */}
          <AddCostDialog employees={data.employees} /> {/* Botão para adicionar custo */}
        </div>
      </div>

      {/* --- Cards de Resumo (sem alteração aqui) --- */}
      <div className="grid gap-4 md:grid-cols-4"> {/* Grid responsivo para os cards */}
         {/* Card Receita Total (Serviços Pontuais) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Serviços)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalRevenue)}
            </div>
            {/* Descrição dinâmica baseada no período */}
            <p className="text-xs text-muted-foreground">
              {period === "week" ? "Última semana" : period === "month" ? "Mês atual" : period === "quarter" ? "Trimestre atual" : "Ano atual"} (Apenas Serviços Pontuais)
            </p>
          </CardContent>
        </Card>
         {/* Card Custos Totais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" /> {/* Ícone indicando custo */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground">{data.costs?.length || 0} lançamentos</p>
          </CardContent>
        </Card>
        {/* Card Lucro Líquido (Serviços Pontuais) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro (Serviços)</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" /> {/* Ícone indicando lucro */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.profit)}
            </div>
             <p className="text-xs text-muted-foreground">
               {/* Calcula a margem de lucro */}
               Margem: {data.totalRevenue > 0 ? ((data.profit / data.totalRevenue) * 100).toFixed(1) : 0}% (Apenas Serviços Pontuais)
            </p>
          </CardContent>
        </Card>
        {/* Card Folha de Pagamento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folha de Pagamento</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalSalaries)}
            </div>
            <p className="text-xs text-muted-foreground">{data.employees?.length || 0} colaboradores ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Gráficos Financeiros (sem alteração aqui) --- */}
      <FinancialCharts costs={data.costs || []} costsByCategory={data.costsByCategory} />

      {/* --- Abas - Adicionada "Pagamentos de Clientes" --- */}
      <Tabs defaultValue="costs" className="space-y-4"> {/* Define 'costs' como aba padrão */}
        {/* Lista de abas (gatilhos) - agora com 4 colunas */}
        <TabsList className="grid w-full grid-cols-4">
          {/* Gatilho da nova aba */}
          <TabsTrigger value="clientPayments">
              <Users className="mr-2 h-4 w-4"/> Pagamentos de Clientes
          </TabsTrigger>
          <TabsTrigger value="costs">Custos Detalhados</TabsTrigger>
          <TabsTrigger value="services">Serviços Pontuais</TabsTrigger>
          <TabsTrigger value="analysis">Análise por Categoria</TabsTrigger>
        </TabsList>

        {/* --- Conteúdo da Nova Aba de Pagamentos de Clientes --- */}
        <TabsContent value="clientPayments">
          {/* Renderiza a nova tabela de pagamentos */}
          <ClientPaymentsTable clientPayments={data.clientPayments} />
        </TabsContent>
        {/* --- Fim do Conteúdo da Nova Aba --- */}


        {/* Conteúdo da Aba de Custos */}
        <TabsContent value="costs">
          <FinancialTable costs={data.costs || []} /> {/* Tabela de custos detalhados */}
        </TabsContent>

        {/* Conteúdo da Aba de Serviços Pontuais */}
        <TabsContent value="services">
          {/* ... (Conteúdo da aba de serviços permanece o mesmo) ... */}
           <Card>
            <CardHeader>
              <CardTitle>Serviços Pontuais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Verifica se há serviços para listar */}
                {data.services && data.services.length > 0 ? (
                  // Mapeia e exibe cada serviço
                  data.services.map((service: any) => (
                    <div key={service.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.clients?.name}</p> {/* Nome do cliente */}
                        <p className="text-xs text-muted-foreground">
                          {new Date(service.date).toLocaleDateString("pt-BR")} {/* Data formatada */}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.value)} {/* Valor formatado */}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {/* Status do serviço */}
                          {service.status === "completed"
                            ? "Concluído"
                            : service.status === "pending"
                              ? "Pendente"
                              : "Cancelado"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Mensagem exibida se não houver serviços
                  <p className="text-center text-muted-foreground py-8">Nenhum serviço pontual no período</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da Aba de Análise por Categoria */}
        <TabsContent value="analysis">
           {/* ... (Conteúdo da aba de análise permanece o mesmo) ... */}
           <Card>
            <CardHeader>
              <CardTitle>Análise por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Verifica se há categorias para listar */}
                {Object.entries(data.costsByCategory).length > 0 ? (
                  // Mapeia e exibe cada categoria e seu valor total
                  Object.entries(data.costsByCategory)
                    .sort(([, a], [, b]) => b - a) // Ordena por valor (maior primeiro)
                    .map(([category, value]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category}</p>
                          <p className="text-sm text-muted-foreground">
                            {/* Calcula a porcentagem do total */}
                            {data.totalCosts > 0 ? ((value / data.totalCosts) * 100).toFixed(1) : 0}% do total
                          </p>
                        </div>
                        <p className="text-lg font-bold">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)} {/* Valor formatado */}
                        </p>
                      </div>
                    ))
                ) : (
                  // Mensagem exibida se não houver custos
                  <p className="text-center text-muted-foreground py-8">Nenhum custo registrado no período</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
