"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Trash2, Building } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { updateUpsellStatus, deleteClientUpsell } from "@/app/dashboard/commercial/actions"
import { toast } from "sonner"
import { useRole } from "@/app/dashboard/layout" // --- ALTERAÇÃO

interface Upsell {
  id: string
  client_id: string
  status: string
  services: string[] | null
  notes: string | null
  identified_date: string
  clients?: {
    name: string
  }
}

export function ClientCommercialCard({ upsell }: { upsell: Upsell }) {
  const userRole = useRole() // --- ALTERAÇÃO

  // --- ALTERAÇÃO: Define se pode editar ---
  const canEdit = userRole !== "limited"
  // ---------------------------------------

  async function handleStatusChange(newStatus: string) {
    if (!canEdit) return // Proteção extra
    const result = await updateUpsellStatus(upsell.id, newStatus)
    if (result.success) toast.success("Status atualizado!")
    else toast.error("Erro ao atualizar status")
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja remover esta oportunidade?")) return
    const result = await deleteClientUpsell(upsell.id)
    if (result.success) toast.success("Oportunidade removida!")
    else toast.error("Erro ao remover")
  }

  const statusColors: Record<string, string> = {
    identified: "bg-blue-100 text-blue-900 dark:bg-blue-800 dark:text-blue-100",
    negotiating: "bg-yellow-100 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100",
    closed: "bg-green-100 text-green-900 dark:bg-green-800 dark:text-green-100",
    lost: "bg-red-100 text-red-900 dark:bg-red-800 dark:text-red-100",
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{upsell.clients?.name || "Cliente Desconhecido"}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {upsell.services && upsell.services.length > 0 ? (
                  upsell.services.map((service, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Serviços não listados</span>
                )}
              </div>
            </div>

            {/* --- ALTERAÇÃO: Esconde botão de deletar --- */}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {/* ------------------------------------------- */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Identificado em: {format(parseISO(upsell.identified_date), "dd/MM/yy", { locale: ptBR })}</span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-medium">Status:</span>
              <Select
                defaultValue={upsell.status}
                onValueChange={handleStatusChange}
                disabled={!canEdit} // --- ALTERAÇÃO: Desabilita select
              >
                <SelectTrigger className={`w-[140px] h-8 text-xs border-0 ${statusColors[upsell.status] || ""}`}>
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
          </div>

          {upsell.notes && (
            <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground mt-1">{upsell.notes}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
