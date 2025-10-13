"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define os tipos de dados que o componente pode receber
interface ChartData {
  type: 'chart';
  chartType: 'bar' | 'pie';
  data: any[];
  config: {
    dataKey: string;
    categoryKey: string;
  };
  title?: string;
}

const COLORS = ["#03d967", "#00b4d8", "#fca311", "#e5e5e5", "#212529"];

export function DynamicChart({ chartData }: { chartData: ChartData }) {
  if (!chartData || chartData.type !== 'chart') return null;

  return (
    <Card className="max-w-full w-full">
      <CardHeader>
        <CardTitle>{chartData.title || `Gráfico de ${chartData.chartType === 'bar' ? 'Barras' : 'Pizza'}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[350px] w-full">
          {chartData.chartType === 'bar' && (
            <BarChart data={chartData.data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={chartData.config.categoryKey} tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={chartData.config.dataKey} fill="var(--color-primary)" radius={4} />
            </BarChart>
          )}

          {chartData.chartType === 'pie' && (
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie data={chartData.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {chartData.data.map((entry, index) => (
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
