import { createClient } from "@/lib/supabase/server"
import { AddNpsForm } from "@/components/add-nps-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquareHeart } from "lucide-react"

export default async function NpsPage() {
  const supabase = await createClient()

  // Buscar clientes ativos para o seletor
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("status", "active")
    .order("name")

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Avaliação de NPS</h1>
          <p className="text-muted-foreground">
            Central de lançamento de feedbacks e avaliações de clientes.
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquareHeart className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Nova Avaliação</CardTitle>
            <CardDescription>
              Selecione um cliente ativo e registre as notas de satisfação.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            {/* Renderiza o formulário passando a lista de clientes, sem ID pré-definido */}
            <AddNpsForm clients={clients || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
