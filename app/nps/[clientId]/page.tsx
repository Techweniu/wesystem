import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { submitNpsForm } from "./actions"
import { toast } from "sonner"

// Componente para o formulário, para podermos usar "use client"
"use client"
import { useFormState, useFormStatus } from "react-dom"

const npsCategories = [
    { id: 'conteudos_e_roteiros', label: 'Conteúdos e Roteiros' },
    { id: 'audiovisual', label: 'Audiovisual' },
    { id: 'edicao_de_videos', label: 'Edição de Vídeos' },
    { id: 'design', label: 'Design' },
    { id: 'atendimento_assessor', label: 'Atendimento Assessor' },
    { id: 'atendimento_videomaker', label: 'Atendimento VideoMaker' },
    { id: 'comunicacao_e_presenca', label: 'Comunicação e Presença' },
    { id: 'resultado_da_parceria', label: 'Resultado da Parceria' },
];

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" className="w-full" disabled={pending}>{pending ? "Enviando..." : "Enviar Avaliação"}</Button>
}

function NpsForm({ clientId, clientName }: { clientId: string, clientName: string }) {
    const [state, formAction] = useFormState(submitNpsForm, null);

    if (state?.success) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-primary">Obrigado!</h2>
                <p className="mt-2 text-muted-foreground">{state.success}</p>
            </div>
        )
    }

    return (
        <form action={formAction} className="space-y-8">
            <input type="hidden" name="clientId" value={clientId} />
            
            {npsCategories.map(category => (
                <div key={category.id} className="grid gap-2">
                    <Label htmlFor={category.id} className="text-base">{category.label}*</Label>
                    <div className="flex justify-between items-center" id={category.id}>
                        {[...Array(11)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <Label htmlFor={`${category.id}-${i}`} className="text-xs mb-2">{i}</Label>
                                <input type="radio" id={`${category.id}-${i}`} name={category.id} value={i} required className="radio radio-primary" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="grid gap-2">
                <Label htmlFor="observations" className="text-base">Observações</Label>
                <Textarea id="observations" name="observations" placeholder="Deixe aqui seus comentários, elogios ou sugestões..." />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <SubmitButton />
        </form>
    )
}


// Componente da Página (Server Component para buscar os dados)
export default async function NpsPage({ params }: { params: { clientId: string } }) {
    const supabase = await createClient();
    const { data: client } = await supabase.from("clients").select("name").eq("id", params.clientId).single();

    if (!client) {
        notFound();
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
    );
}
