"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ServicesMultiSelect } from "@/components/services-multi-select"
import { addClientUpsell } from "@/app/dashboard/commercial/actions"
import { toast } from "sonner"

interface AddClientUpsellFormProps {
  clientId: string
  onSuccess?: () => void
}

export function AddClientUpsellForm({ clientId, onSuccess }: AddClientUpsellFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append("client_id", clientId)

    const result = await addClientUpsell(formData)

    if (result.success) {
      toast.success("Oportunidade de upsell adicionada!")
      form.reset()
      onSuccess?.()
    } else {
      toast.error("Erro ao adicionar upsell: " + result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select name="status" defaultValue="identified" required>
          <SelectTrigger>
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

      <ServicesMultiSelect name="services" />

      <div className="space-y-2">
        <Label htmlFor="identified_date">Data de Identificação *</Label>
        <Input type="date" name="identified_date" defaultValue={new Date().toISOString().split("T")[0]} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea name="notes" placeholder="Observações sobre esta oportunidade..." rows={3} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando..." : "Salvar Oportunidade"}
      </Button>
    </form>
  )
}
