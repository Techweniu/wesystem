"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface FinancialChartsProps {
  costs: any[]
  costsByCategory: Record<string, number>
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280", "#ec4899", "#14b8a6"]

export function FinancialCharts({ costs, costsByCategory }: FinancialChartsProps) {
  const pieData = Object.entries(costsByCategory)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: category,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8) // Top 8 categories

  // Prepare data for bar chart (costs by month)
  const monthlyData = costs.reduce((acc: any, cost) => {
    const date = new Date(cost.date)
    const month = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    if (!acc[month]) {
      acc[month] = 0
    }
    acc[month] += Number(cost.value)
    return acc
  }, {})

  const barData = Object.entries(monthlyData)
    .map(([month, value]) => ({
      month,
      value,
    }))
    .sort((a, b) => {
      const [monthA] = a.month.split("/")
      const [monthB] = b.month.split("/")
      return monthA.localeCompare(monthB)
    })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                  }
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
