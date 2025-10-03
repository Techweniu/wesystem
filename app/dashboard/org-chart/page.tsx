import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { OrgChartTree } from "@/components/org-chart-tree"
import { AddOrgPositionForm } from "@/components/add-org-position-form"

async function getOrgChartData() {
  const supabase = await createClient()

  // Busca dados da nova tabela 'org_positions'
  const { data: positions, error } = await supabase
    .from("org_positions")
    .select("id, name, role, manager_id")
    .order("name")

  if (error) {
    console.error("Erro ao buscar dados do organograma:", error)
    return { roots: [], allPositions: [] };
  }

  const positionMap = new Map()
  positions.forEach((pos) => {
    positionMap.set(pos.id, { ...pos, children: [] })
  })

  const roots: any[] = []
  positions.forEach((pos) => {
    if (pos.manager_id && positionMap.has(pos.manager_id)) {
      const manager = positionMap.get(pos.manager_id)
      manager.children.push(positionMap.get(pos.id))
    } else {
      roots.push(positionMap.get(pos.id))
    }
  })

  return { roots, allPositions: positions };
}

export default async function OrgChartPage() {
  const { roots, allPositions } = await getOrgChartData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground">Gerencie a estrutura organizacional da empresa</p>
        </div>
        <AddOrgPositionForm positions={allPositions}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Posição
            </Button>
        </AddOrgPositionForm>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hierarquia da Equipe</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-8">
          <div className="flex gap-8 justify-center min-w-max">
            {roots.length > 0 ? (
              roots.map((root) => (
                <OrgChartTree key={root.id} employee={root} />
              ))
            ) : (
              <p className="text-muted-foreground text-center w-full">Nenhuma posição encontrada. Comece adicionando uma liderança.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
