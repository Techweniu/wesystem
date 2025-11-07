"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation" // 1. Importar usePathname
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PeriodSelectorProps {
  currentPeriod: string
}

export function PeriodSelector({ currentPeriod }: PeriodSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname() // 2. Obter o pathname atual

  function handlePeriodChange(period: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", period)
    
    // 3. Usar o pathname na rota e 'replace' para não poluir o histórico
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={currentPeriod} onValueChange={handlePeriodChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">Última Semana</SelectItem>
        <SelectItem value="month">Mês Atual</SelectItem>
        <SelectItem value="quarter">Trimestre Atual</SelectItem>
        <SelectItem value="year">Ano Atual</SelectItem>
      </SelectContent>
    </Select>
  )
}
