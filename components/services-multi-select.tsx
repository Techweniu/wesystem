"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const AVAILABLE_SERVICES = [
  "Gestão de redes sociais",
  "Produção de publicações para Instagram e Facebook",
  "Gravação de audiovisual",
  "Produção e gestão de anúncios online",
  'Produção e gestão de sites ou "landing pages"',
  "DAZAH",
  "Árvore de links",
  "Google Meu Negócio",
  "NIUcast",
  "Gestão de dados (business intelligence)",
  "Instagram Stories, Facebook Stories e YouTube Shorts",
  "Pesquisa de público, preço e praça",
  "Gerenciamento de perfil pessoal",
  "Gestão de Marketplace",
  "Criação e gestão de e-commerce",
  "Estratégias de pontos de venda",
  "Gestão e criação de sistema de gerenciamento de relacionamento com o cliente (CRM)",
  "Cobertura audiovisual de eventos",
  "Gestão de divulgação dos clientes ou gestão de conteúdo gerado pelo usuário (UGC)",
  "Produção e gravação de lives em redes sociais",
  "Produção de mídia para fins estranhos a este contrato",
  "Aluguel de estúdio",
  "Consultoria Comercial",
  "Criação e Gestão de canal no YouTube",
]

interface ServicesMultiSelectProps {
  name: string
  value?: string[]
  onChange?: (services: string[]) => void
}

export function ServicesMultiSelect({ name, value = [], onChange }: ServicesMultiSelectProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(value)

  const handleToggle = (service: string) => {
    const newSelection = selectedServices.includes(service)
      ? selectedServices.filter((s) => s !== service)
      : [...selectedServices, service]

    setSelectedServices(newSelection)
    onChange?.(newSelection)
  }

  return (
    <div className="space-y-2">
      <Label>Serviços Relacionados</Label>
      <input type="hidden" name={name} value={JSON.stringify(selectedServices)} />
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="space-y-2">
          {AVAILABLE_SERVICES.map((service) => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox
                id={`service-${service}`}
                checked={selectedServices.includes(service)}
                onCheckedChange={() => handleToggle(service)}
              />
              <label
                htmlFor={`service-${service}`}
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {service}
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>
      {selectedServices.length > 0 && (
        <p className="text-sm text-muted-foreground">{selectedServices.length} serviço(s) selecionado(s)</p>
      )}
    </div>
  )
}
