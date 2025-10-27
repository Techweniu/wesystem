// bi-dashboard (4)/app/dashboard/org-chart/page.tsx
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { OrgChartTree } from "@/components/org-chart-tree"
import { AddOrgPositionForm } from "@/components/add-org-position-form"
import { cn } from "@/lib/utils"

async function getOrgChartData() {
  const supabase = await createClient()

  const { data: positionsData, error } = await supabase
    .from("employees")
    .select("id, name, role, manager_id")
    .eq('status', 'active')
    .order("name")

  // =====> ADICIONADO TRATAMENTO DE ERRO E DADOS NULOS/VAZIOS <=====
  if (error) {
    console.error("Erro ao buscar dados do organograma:", error)
    return { roots: [], allPositions: [] }; // Retorna arrays vazios em caso de erro
  }

  // Garante que 'positions' seja um array, mesmo que a consulta não retorne nada
  const positions = positionsData || [];

  // Se não houver posições, retorna arrays vazios diretamente
  if (positions.length === 0) {
      return { roots: [], allPositions: [] };
  }
  // =============================================================

  // Monta a estrutura de árvore (código existente)
  const positionMap = new Map()
  positions.forEach((pos) => {
    positionMap.set(pos.id, { ...pos, children: [] })
  })

  const roots: any[] = []
  positions.forEach((pos) => {
    if (pos.manager_id && positionMap.has(pos.manager_id)) {
      const manager = positionMap.get(pos.manager_id)
      // Garante que manager e a posição atual existem antes de adicionar
      if (manager && positionMap.has(pos.id)) {
         manager.children.push(positionMap.get(pos.id))
      }
    } else {
      // Garante que a posição existe antes de adicionar como raiz
      if (positionMap.has(pos.id)) {
          roots.push(positionMap.get(pos.id))
      }
    }
  })

  // Retorna a estrutura montada e a lista completa
  return { roots, allPositions: positions };
}


export default async function OrgChartPage() {
  // A desestruturação agora é segura, pois getOrgChartData sempre retorna o objeto
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

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Hierarquia da Equipe</CardTitle>
        </CardHeader>
        <CardContent className={cn(
            "p-8",
            "overflow-auto" // Mantém rolagem X e Y
        )}>
          <div className="flex gap-8 justify-center min-w-max">
            {/* Verifica se roots existe e tem itens antes de mapear */}
            {roots && roots.length > 0 ? (
              roots.map((root) => (
                <OrgChartTree key={root.id} employee={root} allEmployees={allPositions || []} />
              ))
            ) : (
              <p className="text-muted-foreground text-center w-full py-10">Nenhum colaborador ativo encontrado para exibir no organograma.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
