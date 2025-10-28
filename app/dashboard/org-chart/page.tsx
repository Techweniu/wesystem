// bi-dashboard (4)/app/dashboard/org-chart/page.tsx
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { OrgChartTree } from "@/components/org-chart-tree"
import { AddOrgPositionForm } from "@/components/add-org-position-form"
import { cn } from "@/lib/utils"

async function getOrgChartData(): Promise<{ roots: any[]; allPositions: any[] }> { // Added return type annotation
  const supabase = await createClient()

  // Default return structure
  const defaultReturn = { roots: [], allPositions: [] };

  try {
    const { data: positionsData, error } = await supabase
      .from("employees")
      .select("id, name, role, manager_id")
      .eq('status', 'active')
      .order("name")

    if (error) {
      console.error("Erro ao buscar dados do organograma:", error)
      return defaultReturn; // Return default on error
    }

    const positions = positionsData || [];

    if (positions.length === 0) {
        return defaultReturn; // Return default if no active employees
    }

    // Build the tree structure
    const positionMap = new Map()
    positions.forEach((pos) => {
      positionMap.set(pos.id, { ...pos, children: [] })
    })

    const roots: any[] = []
    positions.forEach((pos) => {
      const currentPosition = positionMap.get(pos.id);
      // Ensure currentPosition exists before proceeding
      if (!currentPosition) return;

      if (pos.manager_id && positionMap.has(pos.manager_id)) {
        const manager = positionMap.get(pos.manager_id)
        // Ensure manager exists before adding child
        if (manager) {
           manager.children.push(currentPosition)
        } else {
           // If manager_id exists but manager not found (e.g., inactive manager), treat as root
           roots.push(currentPosition)
        }
      } else {
        // No manager_id or manager not active/found, treat as root
        roots.push(currentPosition)
      }
    })

    return { roots, allPositions: positions };

  } catch (err) {
      console.error("Erro inesperado em getOrgChartData:", err);
      return defaultReturn; // Return default on unexpected error
  }
}


export default async function OrgChartPage() {
  // getOrgChartData is now guaranteed to return the object structure
  const { roots, allPositions } = await getOrgChartData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground">Gerencie a estrutura da equipe</p>
        </div>
        {/* Pass allPositions (guaranteed to be an array) */}
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
            "overflow-auto" // Scroll horizontal and vertical
            // Optional: "max-h-[calc(100vh-200px)]" // Limit height if needed
        )}>
          <div className="flex gap-8 justify-center min-w-max">
            {/* Check roots array before mapping */}
            {roots.length > 0 ? (
              roots.map((root) => (
                // Pass allPositions (guaranteed to be an array)
                <OrgChartTree key={root.id} employee={root} allEmployees={allPositions} />
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
