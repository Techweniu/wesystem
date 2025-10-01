import { createPublicClient } from "@/lib/supabase/public"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NpsForm } from "./nps-form"

export default async function NpsPage({ params }: { params: { clientId: string } }) {
  const supabase = createPublicClient()
  const { data: client } = await supabase.from("clients").select("name").eq("id", params.clientId).single()

  if (!client) {
    notFound()
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Avaliação de Satisfação</CardTitle>
          <CardDescription className="text-lg">Feedback para {client.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <NpsForm clientId={params.clientId} clientName={client.name} />
        </CardContent>
      </Card>
    </div>
  )
}
