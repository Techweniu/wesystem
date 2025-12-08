"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ExternalLink, Receipt, CreditCard } from "lucide-react"
import { MarkCostPaymentButton } from "@/components/mark-cost-payment-button"

interface FinancialTableProps {
  costs: any[]
}

export function FinancialTable({ costs }: FinancialTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  const uniqueCategories = Array.from(new Set(costs.map((c) => c.category).filter(Boolean)))

  const filteredCosts = costs.filter((cost) => {
    const matchesSearch =
      cost.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cost.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || cost.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Comprov. Custo</TableHead>
              <TableHead className="text-center">Comprov. Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCosts.length > 0 ? (
              filteredCosts.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>
                    <p className="font-medium">{cost.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cost.category || "Sem categoria"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={cost.is_recurring ? "default" : "secondary"}>
                      {cost.is_recurring ? "Recorrente" : "Pontual"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(cost.date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cost.value)}
                  </TableCell>
                  <TableCell>
                    <MarkCostPaymentButton costId={cost.id} amount={cost.value} isPaid={cost.status === "paid"} />
                  </TableCell>
                  <TableCell className="text-center">
                    {cost.proof_url ? (
                      <Button variant="ghost" size="sm" asChild className="gap-1">
                        <a href={cost.proof_url} target="_blank" rel="noopener noreferrer">
                          <Receipt className="h-4 w-4" />
                          <span className="hidden sm:inline">Ver</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {cost.payment_proof_url ? (
                      <Button variant="ghost" size="sm" asChild className="gap-1">
                        <a href={cost.payment_proof_url} target="_blank" rel="noopener noreferrer">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="hidden sm:inline">Ver</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum custo encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
