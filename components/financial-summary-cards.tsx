"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface FinancialSummaryCardsProps {
  // Receitas
  contractsReceived: number
  contractsPending: number
  servicesRevenue: number // <-- Já é "recebido"
  servicesPending: number // <-- NOVO

  // Custos
  salariesPaid: number
  salariesPending: number
  otherCostsPaid: number
  otherCostsPending: number
}

export function FinancialSummaryCards({
  contractsReceived,
  contractsPending,
  servicesRevenue,
  servicesPending, // <-- NOVO
  salariesPaid,
  salariesPending,
  otherCostsPaid,
  otherCostsPending,
}: FinancialSummaryCardsProps) {
  
  // --- NOVOS CÁLCULOS ---
  const totalRecebido = contractsReceived + servicesRevenue
  const totalAReceber = contractsPending + servicesPending
  const totalGeralReceita = totalRecebido + totalAReceber
  
  const totalCosts = salariesPaid + salariesPending + otherCostsPaid + otherCostsPending
  const profit = totalGeralReceita - totalCosts
  const margin = totalGeralReceita > 0 ? (profit / totalGeralReceita) * 100 : 0

  const effectiveRevenue = contractsReceived + servicesRevenue
  const effectiveCosts = salariesPaid + otherCostsPaid
  const effectiveProfit = effectiveRevenue - effectiveCosts
  const effectiveMargin = effectiveRevenue > 0 ? (effectiveProfit / effectiveRevenue) * 100 : 0
  // --- FIM DOS NOVOS CÁLCULOS ---

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      
      {/* ========================================================== */}
      {/* --- CARD DE RECEITA (MODIFICADO) --- */}
      {/* ========================================================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total (Previsto)</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalGeralReceita)}</div>
          <div className="mt-4 space-y-2 text-sm">
            
            {/* Seção Recebido */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Recebido:</span>
              <span className="font-bold text-green-600">{formatCurrency(totalRecebido)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Contratos:</span>
                <span>{formatCurrency(contractsReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Serviços Pontuais:</span>
                <span>{formatCurrency(servicesRevenue)}</span>
              </div>
            </div>

            {/* Seção A Receber */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground font-medium">A Receber:</span>
              <span className="font-bold text-amber-600">{formatCurrency(totalAReceber)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Contratos (MRR):</span>
                <span>{formatCurrency(contractsPending)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Serviços Pontuais:</span>
                <span>{formatCurrency(servicesPending)}</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
      {/* ========================================================== */}
      {/* --- FIM DA MODIFICAÇÃO --- */}
      {/* ========================================================== */}

      {/* Card Custos (Sem alteração) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custos</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalCosts)}</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo com salários:</span>
              <span className="font-medium">{formatCurrency(salariesPaid + salariesPending)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Pagos:</span>
                <span className="text-green-600">{formatCurrency(salariesPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• A pagar:</span>
                <span className="text-amber-600">{formatCurrency(salariesPending)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Outros custos:</span>
              <span className="font-medium">{formatCurrency(otherCostsPaid + otherCostsPending)}</span>
            </div>
            <div className="pl-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">• Pagos:</span>
                <span className="text-green-600">{formatCurrency(otherCostsPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">• A pagar:</span>
                <span className="text-amber-600">{formatCurrency(otherCostsPending)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Lucro (Atualizado para usar totalGeralReceita) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro</CardTitle>
          <TrendingUp className={`h-4 w-4 ${profit >= 0 ? "text-green-600" : "text-red-600"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(profit)}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Margem (Prevista):</span>
              <span className={`font-bold text-lg ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {margin.toFixed(1)}%
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Lucro Efetivo:</span>
                <span className={`font-bold ${effectiveProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(effectiveProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">Margem efetiva:</span>
                <span className={`text-xs font-semibold ${effectiveMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {effectiveMargin.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">(Apenas valores já recebidos e pagos)</p>
            </div>
            <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Receita total (prevista):</span>
                <span>{formatCurrency(totalGeralReceita)}</span>
              </div>
              <div className="flex justify-between">
                <span>Custos totais:</span>
                <span>{formatCurrency(totalCosts)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
