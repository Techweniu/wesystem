"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddClientUpsellForm } from "@/components/add-client-upsell-form"
import { TrendingUp, Calendar, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { updateUpsellStatus, deleteClientUpsell } from "@/app/dashboard/commercial/actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useRole } from "@/app/dashboard/layout"

interface Upsell {
  id: string
  status: string
  identified_date: string
  notes: string | null
  services: string[] | null
}

interface ClientUpsellsSectionProps {
  clientId: string
  upsells: Upsell[]
}

export function ClientUpsellsSection({ clientId, upsells }: ClientUpsellsSectionProps) {
  const userRole = useRole()
  const [open, setOpen] = useState(false)

  async function handleStatusChange(upsellId: string, newStatus: string) {
    const result = await updateUpsellStatus(upsellId, newStatus)
    if (result.success) {
      toast.success("Status atualizado!")
    } else {
      toast.error("Erro ao atualizar status")
    }
  }

  async function handleDelete(upsellId: string) {
    if (!confirm("Tem certeza que deseja deletar esta oportunidade?")) return

    const result = await deleteClientUpsell(upsellId)
    if (result.success) {
      toast.success("Oportunidade deletada!")
    } else {
      toast.error("Erro ao deletar")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Oportunidades de Upsell
        </CardTitle>
        
        {userRole !== "limited" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Adicionar Oportunidade</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Oportunidade de Upsell</DialogTitle>
                <DialogDescription>Registre uma nova oportunidade de venda</DialogDescription>
              </DialogHeader>
              <AddClientUpsellForm clientId={clientId} onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {upsells.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma oportunidade de upsell identificada ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {upsells.map((upsell) => (
              <div key={upsell.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {upsell.services && upsell.services.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium mb-1">Serviços:</p>
                        <div className="flex flex-wrap gap-1">
                          {upsell.services.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Serviços não especificados</p>
                    )}
                  </div>
                  
                  {userRole !== "limited" && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(upsell.id)} className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Identificado em {format(parseISO(upsell.identified_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select 
                    value={upsell.status} 
                    onValueChange={(value) => handleStatusChange(upsell.id, value)}
                    disabled={userRole === "limited"}
                  >
                    <SelectTrigger className="w-[180px] h-8">
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

                {upsell.notes && (
                  <p className="text-sm text-muted-foreground border-t pt-2">
                    <span className="font-medium">Notas:</span> {upsell.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
