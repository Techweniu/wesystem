import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { OrgChartTree } from "@/components/org-chart-tree"
import { AddOrgPositionForm } from "@/components/add-org-position-form"

async function getOrgChartData() {
  const supabase = await createClient()

  // Buscando da tabela 'employees'
  const { data: positions, error } = await supabase
    .from("employees")
    .select("id, name, role, manager_id")
    .eq('status', 'active') // <-- CORREÇÃO ADICIONADA AQUI
    .order("name")

  if (error) {
    console.error("Erro ao buscar dados do organograma:", error)
    return { roots: [], allPositions: [] };
  }

  // O restante da função para montar o gráfico continua igual
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

  // Precisamos passar todos os funcionários ativos para o formulário de edição/criação,
  // para que o campo "Gestor" seja preenchido corretamente.
  return { roots, allPositions: positions };
}

export default async function OrgChartPage() {
  const { roots, allPositions } = await getOrgChartData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground">Gerencie a estrutura da equipe</p>
        </div>
        <AddOrgPositionForm positions={allPositions}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Colaborador
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
                <OrgChartTree key={root.id} employee={root} allEmployees={allPositions} />
              ))
            ) : (
              <p className="text-muted-foreground text-center w-full">Nenhum colaborador ativo encontrado.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
