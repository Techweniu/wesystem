"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PeriodSelectorProps {
  currentPeriod: string
}

export function PeriodSelector({ currentPeriod }: PeriodSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handlePeriodChange(period: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", period)
    router.push(`?${params.toString()}`)
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
