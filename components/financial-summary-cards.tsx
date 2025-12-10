"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface FinancialSummaryCardsProps {
  // Receitas
  contractsReceived: number
  contractsPending: number
  servicesRevenue: number
  servicesPending: number

  // Custos
  salariesPaid: number
  salariesPending: number
  otherCostsPaid: number
  otherCostsPending: number
  
  // Role
  userRole?: "admin" | "limited" | null
}

export function FinancialSummaryCards({
  contractsReceived,
  contractsPending,
  servicesRevenue,
  servicesPending,
  salariesPaid,
  salariesPending,
  otherCostsPaid,
  otherCostsPending,
  userRole
}: FinancialSummaryCardsProps) {
  
  const isLimited = userRole === "limited"

  // --- CÁLCULOS ---
  // Nota: Se for limited, os props chegarão como 0 do servidor, resultando em 0 aqui.
  // A função formatVal irá ignorar o 0 e mostrar ******.
  
  const totalRecebido = contractsReceived + servicesRevenue
  const totalAReceber = contractsPending + servicesPending
  const totalGeralReceita = totalRecebido + totalAReceber
  
  const totalCosts = salariesPaid + salariesPending + otherCostsPaid + otherCostsPending
  const profit = totalGeralReceita - totalCosts
  // Evitar divisão por zero
  const margin = totalGeralReceita > 0 ? (profit / totalGeralReceita) * 100 : 0

  const effectiveRevenue = contractsReceived + servicesRevenue
  const effectiveCosts = salariesPaid + otherCostsPaid
  const effectiveProfit = effectiveRevenue - effectiveCosts
  const effectiveMargin = effectiveRevenue > 0 ? (effectiveProfit / effectiveRevenue) * 100 : 0

  // Função helper local para facilitar a leitura
  const formatVal = (value: number) => formatCurrency(value, isLimited)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      
      {/* ========================================================== */}
      {/* --- CARD DE RECEITA --- */}
      {/* ========================================================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total (Previsto)</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatVal(totalGeralReceita)}</div>
          <div className="mt-4 space-y-2 text-sm">
            
            {/* Seção Recebido */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Recebido:</span>
              <span className="font-bold text-green-600">{formatVal(totalRecebido)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Contratos:</span>
                <span>{formatVal(contractsReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Serviços Pontuais:</span>
                <span>{formatVal(servicesRevenue)}</span>
              </div>
            </div>

            {/* Seção A Receber */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground font-medium">A Receber:</span>
              <span className="font-bold text-amber-600">{formatVal(totalAReceber)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Contratos (MRR):</span>
                <span>{formatVal(contractsPending)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Serviços Pontuais:</span>
                <span>{formatVal(servicesPending)}</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ========================================================== */}
      {/* --- CARD CUSTOS --- */}
      {/* ========================================================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custos</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatVal(totalCosts)}</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo com salários:</span>
              <span className="font-medium">{formatVal(salariesPaid + salariesPending)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Pagos:</span>
                <span className="text-green-600">{formatVal(salariesPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• A pagar:</span>
                <span className="text-amber-600">{formatVal(salariesPending)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Outros custos:</span>
              <span className="font-medium">{formatVal(otherCostsPaid + otherCostsPending)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Pagos:</span>
                <span className="text-green-600">{formatVal(otherCostsPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• A pagar:</span>
                <span className="text-amber-600">{formatVal(otherCostsPending)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================== */}
      {/* --- CARD LUCRO --- */}
      {/* ========================================================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro</CardTitle>
          <TrendingUp className={`h-4 w-4 ${profit >= 0 ? "text-green-600" : "text-red-600"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatVal(profit)}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Margem (Prevista):</span>
              <span className={`font-bold text-lg ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {isLimited ? "**.*%" : margin.toFixed(1) + "%"}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Lucro Efetivo:</span>
                <span className={`font-bold ${effectiveProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatVal(effectiveProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">Margem efetiva:</span>
                <span className={`text-xs font-semibold ${effectiveMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                   {isLimited ? "**.*%" : effectiveMargin.toFixed(1) + "%"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">(Apenas valores já recebidos e pagos)</p>
            </div>
            <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Receita total (prevista):</span>
                <span>{formatVal(totalGeralReceita)}</span>
              </div>
              <div className="flex justify-between">
                <span>Custos totais:</span>
                <span>{formatVal(totalCosts)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
