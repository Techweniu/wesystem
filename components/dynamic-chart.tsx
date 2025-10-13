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
  config?: { // A configuração agora é opcional
    dataKey?: string;
    categoryKey?: string;
  };
  title?: string;
}

const COLORS = ["#03d967", "#00b4d8", "#fca311", "#e5e5e5", "#212529"];

export function DynamicChart({ chartData }: { chartData: ChartData }) {
  // --- VALIDAÇÕES ADICIONADAS AQUI ---
  if (!chartData || chartData.type !== 'chart' || !chartData.data) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro no Gráfico</AlertTitle>
            <AlertDescription>A IA retornou dados de gráfico inválidos.</AlertDescription>
        </Alert>
    );
  }

  const { chartType, data, config, title } = chartData;

  // Validação específica para cada tipo de gráfico
  if (chartType === 'bar' && (!config || !config.dataKey || !config.categoryKey)) {
     return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro no Gráfico de Barras</AlertTitle>
            <AlertDescription>Dados de configuração (`dataKey` ou `categoryKey`) ausentes na resposta da IA.</AlertDescription>
        </Alert>
    );
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
