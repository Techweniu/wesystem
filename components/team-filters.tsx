// Em components/team-filters.tsx

"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useDebouncedCallback } from "use-debounce"

export function TeamFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('name', term)
    } else {
      params.delete('name')
    }
    replace(`${pathname}?${params.toString()}`)
  }, 300)

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams)
    if (status && status !== "all") {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="grid w-full sm:max-w-sm items-center gap-1.5">
        <Label htmlFor="search">Buscar por nome</Label>
        <Input
          type="text"
          id="search"
          placeholder="Nome do colaborador..."
          defaultValue={searchParams.get('name')?.toString() || ''}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="grid w-full sm:w-auto items-center gap-1.5">
        <Label>Filtrar por status</Label>
        <ToggleGroup
            type="single"
            defaultValue={searchParams.get('status')?.toString() || "all"}
            onValueChange={handleStatusChange}
            variant="outline"
        >
            <ToggleGroupItem value="all">Todos</ToggleGroupItem>
            <ToggleGroupItem value="active">Ativos</ToggleGroupItem>
            <ToggleGroupItem value="inactive">Inativos</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
