import { createAdminClient } from "@/lib/supabase/server" // Admin Client
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { OrgChartTree } from "@/components/org-chart-tree"
import { AddOrgPositionForm } from "@/components/add-org-position-form"

// CONFIGURAÇÃO DE CACHE:
// Força a página a ser dinâmica e não usar cache estático.
// Isso garante que os dados exibidos sejam sempre os atuais do banco.
export const dynamic = "force-dynamic"
export const revalidate = 0

async function getOrgChartData(): Promise<{ roots: any[]; allPositions: any[] }> {
  const supabase = createAdminClient() // Busca com privilégios

  const defaultReturn = { roots: [], allPositions: [] }

  try {
    const { data: positionsData, error } = await supabase
      .from("employees")
      .select("id, name, role, manager_id")
      .eq("status", "active")
      .order("name")

    if (error) {
      console.error("Erro ao buscar dados do organograma:", error)
      return defaultReturn
    }

    const positions = positionsData || []

    if (positions.length === 0) {
      return defaultReturn
    }

    const positionMap = new Map()
    positions.forEach((pos) => {
      positionMap.set(pos.id, { ...pos, children: [] })
    })

    const roots: any[] = []
    positions.forEach((pos) => {
      const currentPosition = positionMap.get(pos.id)
      if (!currentPosition) return

      if (pos.manager_id && positionMap.has(pos.manager_id)) {
        const manager = positionMap.get(pos.manager_id)
        if (manager) {
          manager.children.push(currentPosition)
        } else {
          roots.push(currentPosition)
        }
      } else {
        roots.push(currentPosition)
      }
    })

    return { roots, allPositions: positions }
  } catch (err) {
    console.error("Erro inesperado em getOrgChartData:", err)
    return defaultReturn
  }
}

export default async function OrgChartPage() {
  const { roots, allPositions } = await getOrgChartData()

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
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

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Hierarquia da Equipe</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-8 overflow-auto">
          <div className="flex gap-8 justify-center min-w-max">
            {roots.length > 0 ? (
              roots.map((root) => <OrgChartTree key={root.id} employee={root} allEmployees={allPositions} />)
            ) : (
              <p className="text-muted-foreground text-center w-full py-10">
                Nenhum colaborador ativo encontrado para exibir no organograma.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
