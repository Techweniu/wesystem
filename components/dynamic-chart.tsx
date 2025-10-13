"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Define os tipos de dados que o componente pode receber
interface ChartData {
  type: 'chart';
  chartType: 'bar' | 'pie';
  data: any[];
  config?: {
    dataKey?: string;
    categoryKey?: string;
  };
  title?: string;
}

const COLORS = ["#03d967", "#00b4d8", "#fca311", "#e5e5e5", "#212529"];

export function DynamicChart({ chartData }: { chartData: ChartData }) {
  // --- VALIDAÇÕES REFORÇADAS ---
  if (!chartData || chartData.type !== 'chart') {
    return null; // Não renderiza nada se não for um objeto de gráfico válido
  }

  const { chartType, data, config, title } = chartData;

  // 1. Valida se 'data' é um array e não está vazio
  if (!Array.isArray(data) || data.length === 0) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro nos Dados do Gráfico</AlertTitle>
            <AlertDescription>A IA retornou um conjunto de dados vazio ou em formato incorreto.</AlertDescription>
        </Alert>
    );
  }

  // 2. Validações específicas para Gráfico de Barras
  if (chartType === 'bar') {
    if (!config || !config.dataKey || !config.categoryKey) {
       return (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro de Configuração</AlertTitle>
              <AlertDescription>A resposta da IA para o gráfico de barras não incluiu as chaves de configuração necessárias (`dataKey`, `categoryKey`).</AlertDescription>
          </Alert>
      );
    }
    // Valida se as chaves existem no primeiro item dos dados
    const firstItem = data[0];
    if (typeof firstItem[config.dataKey] === 'undefined' || typeof firstItem[config.categoryKey] === 'undefined') {
        return (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Incompatibilidade de Dados</AlertTitle>
              <AlertDescription>As chaves de dados (`{config.dataKey}`, `{config.categoryKey}`) fornecidas pela IA não foram encontradas nos dados recebidos.</AlertDescription>
          </Alert>
        );
    }
  }

  // 3. Validações específicas para Gráfico de Pizza
  if (chartType === 'pie') {
      const firstItem = data[0];
      if (typeof firstItem.name === 'undefined' || typeof firstItem.value === 'undefined') {
          return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro de Dados</AlertTitle>
                <AlertDescription>Os dados para o gráfico de pizza devem conter as propriedades "name" e "value" em cada item.</AlertDescription>
            </Alert>
          );
      }
  }
  // --- FIM DAS VALIDAÇÕES ---

  return (
    <Card className="max-w-full w-full">
      <CardHeader>
        <CardTitle>{title || `Gráfico de ${chartType === 'bar' ? 'Barras' : 'Pizza'}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[350px] w-full">
          {chartType === 'bar' && (
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={config?.categoryKey} tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={config?.dataKey} fill="var(--color-primary)" radius={4} />
            </BarChart>
          )}

          {chartType === 'pie' && (
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
