"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, TrendingUp, DollarSign, Plus, AlertCircle } from "lucide-react"
import { AddClientUpsellForm } from "@/components/add-client-upsell-form"
import { useState } from "react"
import { updateUpsellStatus } from "@/app/dashboard/commercial/actions"
import { toast } from "sonner"

interface ClientCommercialCardProps {
  client: {
    id: string
    name: string
    status: string
    contracts: Array<{
      id: string
      valor_mensal: number
      status: string
    }>
    one_time_services: Array<{
      id: string
      value: number
      status: string
    }>
    client_upsells: Array<{
      id: string
      status: string
      identified_date: string
      notes: string | null
      services: string[] | null
    }>
  }
}

export function ClientCommercialCard({ client }: ClientCommercialCardProps) {
  const [open, setOpen] = useState(false)

  // Calcular valor recorrente (contratos ativos)
  const recurringValue =
    client.contracts?.filter((c) => c.status === "active").reduce((sum, c) => sum + Number(c.valor_mensal), 0) || 0

  // Calcular valor de serviços pontuais (concluídos)
  const servicesValue =
    client.one_time_services?.filter((s) => s.status === "completed").reduce((sum, s) => sum + Number(s.value), 0) || 0

  // Filtrar upsells ativos (não fechados ou perdidos)
  const activeUpsells = client.client_upsells?.filter((u) => u.status !== "closed" && u.status !== "lost") || []

  const statusColors = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    pending: "bg-yellow-500",
  }

  const upsellStatusLabels = {
    identified: "Identificado",
    negotiating: "Em Negociação",
    closed: "Fechado",
    lost: "Perdido",
  }

  console.log("[v0] Client upsells:", client.client_upsells)

  const handleStatusChange = async (upsellId: string, newStatus: string) => {
    const result = await updateUpsellStatus(upsellId, newStatus)
    if (result.success) {
      toast.success("Status atualizado com sucesso!")
    } else {
      toast.error("Erro ao atualizar status: " + result.error)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <Badge variant="outline" className={statusColors[client.status as keyof typeof statusColors]}>
              {client.status}
            </Badge>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Upsell
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Oportunidade de Upsell</DialogTitle>
                <DialogDescription>Registre uma nova oportunidade de venda para {client.name}</DialogDescription>
              </DialogHeader>
              <AddClientUpsellForm clientId={client.id} onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <CardTitle className="text-lg line-clamp-1">{client.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Valores Financeiros */}
        <div className="space-y-2 pb-3 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Recorrente
            </span>
            <span className="font-semibold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(recurringValue)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Serviços Pontuais
            </span>
            <span className="font-semibold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(servicesValue)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Oportunidades</span>
            <Badge variant="secondary">{activeUpsells.length}</Badge>
          </div>
          {activeUpsells.length === 0 ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Nenhuma oportunidade registrada
            </p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeUpsells.map((upsell) => {
                console.log("[v0] Upsell services:", upsell.services, "Type:", typeof upsell.services)
                return (
                  <div key={upsell.id} className="text-xs p-2 bg-muted rounded-md space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {upsell.services && upsell.services.length > 0 ? (
                          <p className="font-medium">{upsell.services.join(", ")}</p>
                        ) : (
                          <p className="font-medium text-muted-foreground">Serviços não especificados</p>
                        )}
                      </div>
                      <Select
                        defaultValue={upsell.status}
                        onValueChange={(value) => handleStatusChange(upsell.id, value)}
                      >
                        <SelectTrigger className="h-6 text-xs w-[130px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="identified">Identificado</SelectItem>
                          <SelectItem value="negotiating">Em Negociação</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                          <SelectItem value="lost">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {upsell.notes && <p className="text-muted-foreground line-clamp-2">{upsell.notes}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
