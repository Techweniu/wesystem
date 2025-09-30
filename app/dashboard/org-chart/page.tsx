import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrgChartTree } from "@/components/org-chart-tree"

async function getOrgChartData() {
  const supabase = await createClient()

  const { data: employees, error } = await supabase
    .from("employees")
    .select(
      `
      *,
      manager:manager_id(id, name, role)
    `,
    )
    .eq("status", "active")
    .order("name")

  if (error) {
    console.error("Erro ao buscar dados do organograma:", error)
    return []
  }

  // Build hierarchical structure
  const employeeMap = new Map()
  employees?.forEach((emp) => {
    employeeMap.set(emp.id, {
      ...emp,
      children: [],
    })
  })

  const roots: any[] = []
  employees?.forEach((emp) => {
    const employee = employeeMap.get(emp.id)
    if (emp.manager_id) {
      const manager = employeeMap.get(emp.manager_id)
      if (manager) {
        manager.children.push(employee)
      }
    } else {
      roots.push(employee)
    }
  })

  return roots
}

export default async function OrgChartPage() {
  const orgData = await getOrgChartData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
        <p className="text-muted-foreground">Estrutura organizacional da empresa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hierarquia da Equipe</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-max p-8">
            {orgData.length > 0 ? (
              orgData.map((root) => (
                <OrgChartTree key={root.id} employee={root} />
              ))
            ) : (
              <p className="text-muted-foreground">Não foi possível carregar os dados do organograma.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
